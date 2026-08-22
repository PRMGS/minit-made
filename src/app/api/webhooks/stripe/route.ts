import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmationEmail, sendOpsAlert } from "@/lib/email";
import { provisionAndCreateAccessLink } from "@/lib/artistAccount";
import { formatMoney } from "@/lib/constants";
import { syncBatchToCalendar } from "@/lib/googleCalendar";

// Signature verification needs the raw body.
export const runtime = "nodejs";

/**
 * Stripe is the authority on payment. This handler's contract:
 *
 *   500 ONLY when a retry could plausibly succeed (transport/DB failure).
 *   200 + loud log + ops alert for everything a retry cannot fix.
 *
 * That distinction matters in both directions: previously every database write
 * was unchecked and the route returned 200 regardless, so a failed write meant
 * Stripe never retried and the payment was silently lost. Conversely, returning
 * 500 for un-retryable cases would get the endpoint disabled by Stripe.
 *
 * All confirmation state changes go through `confirm_booking_payment`, which does
 * event-dedupe, booking lock, slot claim and status flip in one transaction.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Async, not the synchronous constructEvent. On a Web Crypto runtime — which
    // is what this worker is under the Cloudflare adapter — the sync path throws
    // "SubtleCryptoProvider cannot be used in a synchronous context" and every
    // event would fail verification. The async form behaves identically on Node,
    // so this is correct on both runtimes.
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    console.warn("[stripe:webhook] signature verification failed", e);
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        return await handlePaid(event);

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed":
        return await handleUnpaid(event);

      default:
        return NextResponse.json({ received: true });
    }
  } catch (e) {
    // Unexpected throw: let Stripe retry rather than silently dropping a payment.
    console.error("[stripe:webhook] unhandled error", { type: event.type, id: event.id, error: e });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function handlePaid(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const bookingId = session.metadata?.booking_id;

  // An async method can complete the session before funds settle.
  if (session.payment_status !== "paid") {
    console.warn("[stripe:webhook] session not yet paid", {
      id: session.id,
      payment_status: session.payment_status,
    });
    return NextResponse.json({ received: true });
  }

  if (!bookingId) {
    // A retry cannot conjure metadata — this needs a human.
    console.error("[stripe:orphan-payment] no booking_id in metadata", {
      session: session.id,
      amount: session.amount_total,
      email: session.customer_details?.email,
    });
    await sendOpsAlert("Payment received with no booking reference", [
      `Stripe session: ${session.id}`,
      `Amount: ${formatMoney(session.amount_total ?? 0)}`,
      `Email: ${session.customer_details?.email ?? "unknown"}`,
      "This payment could not be matched to a booking and needs manual reconciliation.",
    ]);
    return NextResponse.json({ received: true });
  }

  const supabase = createAdminClient();

  // Cheap guard: line items are built server-side, so a mismatch means something
  // is wrong upstream and should not be auto-confirmed.
  const { data: preBooking, error: readError } = await supabase
    .from("bookings")
    .select("total_price, artist_id, artists(email)")
    .eq("id", bookingId)
    .maybeSingle();

  if (readError) {
    console.error("[stripe:webhook] booking read failed", { bookingId, error: readError });
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 });
  }

  if (!preBooking) {
    console.error("[stripe:webhook] booking not found for paid session", { bookingId, session: session.id });
    await sendOpsAlert("Paid session references a missing booking", [
      `Booking id: ${bookingId}`,
      `Stripe session: ${session.id}`,
      `Amount: ${formatMoney(session.amount_total ?? 0)}`,
    ]);
    return NextResponse.json({ received: true });
  }

  if (session.amount_total != null && session.amount_total !== preBooking.total_price) {
    console.error("[stripe:webhook] amount mismatch", {
      bookingId,
      charged: session.amount_total,
      expected: preBooking.total_price,
    });
    await sendOpsAlert("Payment amount does not match booking total", [
      `Booking id: ${bookingId}`,
      `Charged: ${formatMoney(session.amount_total)}`,
      `Expected: ${formatMoney(preBooking.total_price)}`,
      "Booking was NOT confirmed automatically.",
    ]);
    return NextResponse.json({ received: true });
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;

  const { data: result, error: rpcError } = await supabase.rpc("confirm_booking_payment", {
    p_booking_id: bookingId,
    p_stripe_event_id: event.id,
    p_payment_intent_id: paymentIntentId,
    p_checkout_session_id: session.id,
  } as never);

  if (rpcError) {
    // Retryable: the RPC is idempotent, so Stripe replaying this is safe.
    console.error("[stripe:webhook] confirm RPC failed", { bookingId, error: rpcError });
    return NextResponse.json({ error: "Confirmation failed" }, { status: 500 });
  }

  const outcome = result as { result: string; slot?: string; needs_scheduling?: boolean };

  if (outcome.result === "duplicate_event" || outcome.result === "already_confirmed") {
    return NextResponse.json({ received: true, outcome: outcome.result });
  }

  if (outcome.result === "booking_not_found") {
    console.error("[stripe:webhook] booking vanished mid-confirm", { bookingId });
    await sendOpsAlert("Booking disappeared during confirmation", [`Booking id: ${bookingId}`]);
    return NextResponse.json({ received: true });
  }

  // Confirmed. Money is captured, so nothing below may fail the request.
  if (outcome.slot !== "claimed") {
    console.warn("[stripe:webhook] confirmed without a slot", { bookingId, slot: outcome.slot });
    await sendOpsAlert("Paid booking needs manual scheduling", [
      `Booking id: ${bookingId}`,
      `Slot claim result: ${outcome.slot}`,
      "The artist is confirmed but has no shoot assigned. They were told we'll be in touch.",
    ]);
  }

  const email = preBooking.artists?.email;
  let dashboardUrl: string | undefined;
  if (email) {
    dashboardUrl = (await provisionAndCreateAccessLink({ artistId: preBooking.artist_id, email })) ?? undefined;
  }

  const send = await sendBookingConfirmationEmail(bookingId, dashboardUrl);
  if (send.status === "failed") {
    // Recovery is the admin resend endpoint, not a Stripe retry loop over
    // already-captured money.
    await sendOpsAlert("Confirmation email failed to send", [
      `Booking id: ${bookingId}`,
      `Recipient: ${email ?? "unknown"}`,
      `Error: ${send.detail ?? "unknown"}`,
    ]);
  }

  // Money is already captured and the response below is already decided as
  // success — a Calendar failure here must never turn this into a 500 (Stripe
  // would retry an already-confirmed payment). Wrapped defensively even though
  // syncBatchToCalendar itself never throws.
  if (outcome.slot === "claimed") {
    try {
      const { data: finalBooking } = await supabase.from("bookings").select("batch_id").eq("id", bookingId).maybeSingle();
      if (finalBooking?.batch_id) {
        const sync = await syncBatchToCalendar(finalBooking.batch_id);
        if (sync.status === "failed") {
          console.error("[stripe:webhook] calendar sync failed", {
            bookingId,
            batchId: finalBooking.batch_id,
            detail: sync.detail,
          });
        }
      }
    } catch (e) {
      console.error("[stripe:webhook] calendar sync threw", { bookingId, error: e });
    }
  }

  return NextResponse.json({ received: true, outcome: "confirmed" });
}

async function handleUnpaid(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return NextResponse.json({ received: true });

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("expire_booking_payment", {
    p_booking_id: bookingId,
    p_stripe_event_id: event.id,
  } as never);

  if (error) {
    console.error("[stripe:webhook] expire RPC failed", { bookingId, error });
    return NextResponse.json({ error: "Expiry failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
