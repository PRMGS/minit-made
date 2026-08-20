import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { addOnLabel, formatLabel } from "@/lib/constants";
import { ARTIST_ERRORS, safeApiError } from "@/lib/errors";
import { siteUrl } from "@/lib/env";

export const runtime = "nodejs";

type Snapshot = {
  base_price: number;
  add_ons: { type: string; price: number }[];
  total_price: number;
};

/**
 * "Finish payment" for a booking the artist backed out of.
 *
 * A payment_pending booking showed in My Bookings with its full price and the
 * status "Almost There", and offered no way to complete — the only route back
 * was re-typing the seven-step form.
 *
 * Prices come from the stored pricing_snapshot, never the request, so resuming
 * cannot be used to pay yesterday's price for today's booking or to pay nothing
 * at all.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: ARTIST_ERRORS.signedOut }, { status: 401 });

  const { data: artist } = await supabase
    .from("artists")
    .select("id, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!artist) return NextResponse.json({ error: ARTIST_ERRORS.noAccountYet }, { status: 403 });

  // Ownership is enforced here as well as by RLS.
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, format, payment_status, total_price, pricing_snapshot, stripe_checkout_session_id")
    .eq("id", id)
    .eq("artist_id", artist.id)
    .maybeSingle();

  if (!booking) return NextResponse.json({ error: ARTIST_ERRORS.bookingNotFound }, { status: 404 });

  if (booking.payment_status === "completed") {
    return NextResponse.json({ error: "That one's already paid for." }, { status: 409 });
  }
  if (booking.payment_status !== "pending") {
    return NextResponse.json(
      { error: "That booking has expired. Start a new application and we'll get you booked." },
      { status: 409 }
    );
  }

  const snapshot = booking.pricing_snapshot as Snapshot | null;
  if (!snapshot?.total_price) {
    return NextResponse.json({ error: ARTIST_ERRORS.pricingUnavailable }, { status: 409 });
  }

  // Two live sessions for one booking could both complete.
  if (booking.stripe_checkout_session_id) {
    try {
      await stripe.checkout.sessions.expire(booking.stripe_checkout_session_id);
    } catch {
      // Already expired or completed — safe to ignore.
    }
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `${formatLabel(booking.format)} — Video Production` },
            unit_amount: snapshot.base_price,
          },
          quantity: 1,
        },
        ...(snapshot.add_ons ?? []).map((a) => ({
          price_data: {
            currency: "usd",
            product_data: { name: addOnLabel(a.type) },
            unit_amount: a.price,
          },
          quantity: 1,
        })),
      ],
      customer_email: artist.email,
      success_url: `${siteUrl()}/apply/confirmed?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/artist/bookings/${booking.id}`,
      metadata: { booking_id: booking.id },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
  } catch (e) {
    return NextResponse.json(
      { error: safeApiError("resume:stripe", e, ARTIST_ERRORS.checkoutFailed) },
      { status: 502 }
    );
  }

  await createAdminClient()
    .from("bookings")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", booking.id);

  return NextResponse.json({ url: session.url });
}
