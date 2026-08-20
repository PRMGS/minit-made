import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { provisionAndCreateAccessLink } from "@/lib/artistAccount";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { SUPPORT_EMAIL } from "@/lib/errors";
import ConfirmationPoller from "./ConfirmationPoller";

export const dynamic = "force-dynamic";

/**
 * Verifies real payment state instead of asserting success.
 *
 * Previously this page rendered "You're In." unconditionally — anyone could hit
 * the URL, and, worse, a broken webhook was invisible to the artist.
 *
 * Proof of payment is the Stripe session id that Stripe itself appended to the
 * redirect. If Stripe says paid but the row is still pending, we reconcile here
 * rather than making the artist watch a spinner: `confirm_booking_payment` is
 * keyed on an event id, so this racing the real webhook is safe — whichever runs
 * second gets `duplicate_event`.
 */
export default async function ConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ booking_id?: string; session_id?: string }>;
}) {
  const { booking_id: bookingId, session_id: sessionId } = await searchParams;

  let paid = false;
  let confirmed = false;
  let dashboardUrl: string | null = null;

  if (bookingId && sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      paid = session.payment_status === "paid" && session.metadata?.booking_id === bookingId;

      if (paid) {
        const supabase = createAdminClient();
        const { data: booking } = await supabase
          .from("bookings")
          .select("payment_status, artist_id, artists(email)")
          .eq("id", bookingId)
          .maybeSingle();

        if (booking?.payment_status !== "completed") {
          // Self-heal: rescue a webhook that hasn't landed (or is broken).
          await supabase.rpc("confirm_booking_payment", {
            p_booking_id: bookingId,
            p_stripe_event_id: `reconcile:${sessionId}`,
            p_payment_intent_id:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
            p_checkout_session_id: sessionId,
          } as never);
        }

        const { data: after } = await supabase
          .from("bookings")
          .select("payment_status")
          .eq("id", bookingId)
          .maybeSingle();
        confirmed = after?.payment_status === "completed";

        // They're here right now, so a fresh link will be clicked in seconds.
        if (confirmed && booking?.artists?.email) {
          dashboardUrl = await provisionAndCreateAccessLink({
            artistId: booking.artist_id,
            email: booking.artists.email,
          });

          // The webhook normally sends this. If it never fired (misconfigured,
          // or down), self-healing the booking without also sending the email
          // would leave the artist confirmed but never contacted — and nothing
          // would record the omission. sendBookingConfirmationEmail is
          // idempotent via email_deliveries, so a later webhook won't duplicate.
          const send = await sendBookingConfirmationEmail(bookingId, dashboardUrl ?? undefined);
          if (send.status === "failed") {
            console.error("[confirmed] confirmation email failed", { bookingId, detail: send.detail });
          }
        }
      }
    } catch (e) {
      console.error("[confirmed] verification failed", { bookingId, error: e });
    }
  }

  if (confirmed) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-gold mb-4">You&apos;re In.</h1>
        <p className="text-neutral-300 mb-8">
          Check your email — we&apos;ll send everything you need before your shoot. Your dashboard
          is where it all lives from here.
        </p>
        <Link href={dashboardUrl ?? "/artist/access"} className="btn-gold inline-block">
          Go to My Dashboard
        </Link>
      </main>
    );
  }

  if (paid) {
    // Payment is real but confirmation hasn't settled — say so honestly.
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-24 text-center">
        <h1 className="text-3xl font-bold text-gold mb-4">Payment Received.</h1>
        <p className="text-neutral-300 mb-8">
          We&apos;re just finishing up on our end. This page will update in a moment — your email
          is on its way either way.
        </p>
        <ConfirmationPoller bookingId={bookingId!} sessionId={sessionId!} />
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-6 py-24 text-center">
      <h1 className="text-3xl font-bold mb-4">Still Processing</h1>
      <p className="text-neutral-300 mb-8">
        We can&apos;t confirm this one yet. If you completed payment, check your email — and if
        nothing arrives, reach us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-gold">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
      <Link href="/artist/access" className="btn-gold inline-block">
        Get a Sign-In Link
      </Link>
    </main>
  );
}
