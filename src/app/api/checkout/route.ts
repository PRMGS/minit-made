import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePricing } from "@/lib/pricing";
import { stripe } from "@/lib/stripe";
import { TERMS_VERSION, addOnLabel, formatLabel } from "@/lib/constants";
import { ARTIST_ERRORS, safeApiError } from "@/lib/errors";
import { parseJson } from "@/lib/apiRequest";
import { checkoutSchema } from "@/lib/apiSchemas";
import { siteUrl } from "@/lib/env";

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, checkoutSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  // Kept separate from schema validation so the artist gets copy about the terms
  // rather than a generic "some details are missing".
  if (!body.termsAccepted) {
    return NextResponse.json({ error: ARTIST_ERRORS.termsRequired }, { status: 400 });
  }

  // Already narrowed to the known ids by the schema.
  const validAddOns = body.addOns;
  const supabase = createAdminClient();

  let pricing;
  try {
    pricing = await calculatePricing(supabase, body.format, validAddOns);
  } catch (e) {
    return NextResponse.json(
      { error: safeApiError("checkout:pricing", e, ARTIST_ERRORS.pricingUnavailable) },
      { status: 400 }
    );
  }

  // Upsert artist by email
  const { data: existingArtist } = await supabase
    .from("artists")
    .select("id")
    .eq("email", body.artist.email)
    .maybeSingle();

  let artistId = existingArtist?.id;
  if (!artistId) {
    const { data: newArtist, error: artistErr } = await supabase
      .from("artists")
      .insert({
        name: body.artist.name,
        artist_name: body.artist.artist_name,
        email: body.artist.email,
        phone: body.artist.phone,
        city: body.artist.city,
        instagram: body.artist.instagram,
        tiktok: body.artist.tiktok,
        youtube: body.artist.youtube,
        spotify: body.artist.spotify,
        soundcloud: body.artist.soundcloud,
        apple_music: body.artist.apple_music,
        bio: body.artist.bio,
      })
      .select("id")
      .single();
    if (artistErr || !newArtist) {
      return NextResponse.json(
        { error: safeApiError("checkout:artist", artistErr, ARTIST_ERRORS.checkoutFailed) },
        { status: 500 }
      );
    }
    artistId = newArtist.id;
  } else {
    await supabase
      .from("artists")
      .update({
        name: body.artist.name,
        artist_name: body.artist.artist_name,
        phone: body.artist.phone,
        city: body.artist.city,
        instagram: body.artist.instagram,
        tiktok: body.artist.tiktok,
        youtube: body.artist.youtube,
        spotify: body.artist.spotify,
        soundcloud: body.artist.soundcloud,
        apple_music: body.artist.apple_music,
        bio: body.artist.bio,
      })
      .eq("id", artistId);
  }

  // Find next available open batch for this format (informational only; admin assigns exact slot after payment)
  const { data: batch } = await supabase
    .from("shoot_batches")
    .select("id")
    .eq("format", body.format)
    .eq("status", "open")
    .order("shoot_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Reuse an abandoned attempt instead of stacking duplicate bookings.
  // The cancel URL already carries booking_id but nothing consumed it, so every
  // back-out-and-retry previously inserted a fresh booking plus child rows.
  // Ordered and limited rather than maybeSingle(): with two pending attempts for
  // the same artist and format, maybeSingle() errors instead of returning a row,
  // and the error path then created a third — each duplicate making the next
  // attempt worse. Newest wins.
  const { data: reusable } = await supabase
    .from("bookings")
    .select("id, stripe_checkout_session_id")
    .eq("artist_id", artistId)
    .eq("format", body.format)
    .eq("payment_status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const bookingFields = {
    artist_id: artistId,
    batch_id: batch?.id ?? null,
    format: body.format,
    status: "payment_pending",
    payment_status: "pending",
    base_price: pricing.base_price,
    add_ons_total: pricing.add_ons_total,
    total_price: pricing.total_price,
    pricing_snapshot: pricing,
    terms_accepted: true,
    terms_version: TERMS_VERSION,
    terms_accepted_at: new Date().toISOString(),
  };

  let booking: { id: string } | null = null;
  let bookingErr: unknown = null;

  if (reusable) {
    // Expire the stale session, or two live sessions could both complete.
    if (reusable.stripe_checkout_session_id) {
      try {
        await stripe.checkout.sessions.expire(reusable.stripe_checkout_session_id);
      } catch {
        // Already expired or completed — safe to ignore.
      }
    }
    const { error } = await supabase
      .from("bookings")
      .update(bookingFields as never)
      .eq("id", reusable.id);
    bookingErr = error;
    booking = error ? null : { id: reusable.id };

    if (booking) {
      // Replace children so a changed add-on set can't leave stale rows.
      await supabase.from("add_on_orders").delete().eq("booking_id", booking.id);
      await supabase.from("interview_responses").delete().eq("booking_id", booking.id);
      await supabase.from("music_submissions").delete().eq("booking_id", booking.id);
      await supabase.from("production_prep").delete().eq("booking_id", booking.id);
    }
  } else {
    const { data, error } = await supabase
      .from("bookings")
      .insert(bookingFields as never)
      .select("id")
      .single();
    bookingErr = error;
    booking = data;
  }

  if (bookingErr || !booking) {
    return NextResponse.json(
      { error: safeApiError("checkout:booking", bookingErr, ARTIST_ERRORS.checkoutFailed) },
      { status: 500 }
    );
  }

  await supabase.from("music_submissions").insert({
    booking_id: booking.id,
    song_title: body.music.song_title,
    artist_name: body.music.artist_name,
    spotify_url: body.music.spotify_url,
    apple_music_url: body.music.apple_music_url,
    youtube_url: body.music.youtube_url,
    soundcloud_url: body.music.soundcloud_url,
    audio_file_url: body.music.audio_file_url,
    instrumental_file_url: body.music.instrumental_file_url,
    lyrics: body.music.lyrics,
    performance_notes: body.music.performance_notes,
    explicit_content: body.music.explicit_content,
    submission_status: "submitted",
  });

  await supabase.from("production_prep").insert({
    booking_id: booking.id,
    performance_vibe: body.prep.performance_vibe,
    special_requests: body.prep.special_requests,
    height: body.prep.height,
    broll_preference: body.prep.broll_preference,
    production_notes: body.prep.production_notes,
  });

  if (validAddOns.length > 0) {
    await supabase.from("add_on_orders").insert(
      pricing.add_ons.map((a) => ({
        booking_id: booking.id,
        add_on_type: a.type,
        price_at_purchase: a.price,
        production_status: "pending",
      }))
    );
  }

  if (validAddOns.includes("interview") && body.interview) {
    await supabase.from("interview_responses").insert({
      booking_id: booking.id,
      ...body.interview,
    });
  }

  const lineItems: { price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: number }[] = [
    {
      price_data: {
        currency: "usd",
        product_data: { name: `${formatLabel(body.format)} — Video Production` },
        unit_amount: pricing.base_price,
      },
      quantity: 1,
    },
    ...pricing.add_ons.map((a) => ({
      price_data: {
        currency: "usd",
        product_data: { name: addOnLabel(a.type) },
        unit_amount: a.price,
      },
      quantity: 1,
    })),
  ];

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: body.artist.email,
      success_url: `${siteUrl()}/apply/confirmed?booking_id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/apply?step=review&booking_id=${booking.id}`,
      metadata: { booking_id: booking.id },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
  } catch (e) {
    return NextResponse.json(
      { error: safeApiError("checkout:stripe", e, ARTIST_ERRORS.checkoutFailed) },
      { status: 502 }
    );
  }

  await supabase
    .from("bookings")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", booking.id);

  return NextResponse.json({ url: session.url, booking_id: booking.id });
}
