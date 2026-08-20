import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { provisionAndCreateAccessLink } from "@/lib/artistAccount";

export const runtime = "nodejs";

/**
 * Recovery path for a confirmation email that failed to send. Tracking a failure
 * is only useful if there's a one-click way to fix it.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("artist_id, artists(email)")
    .eq("id", id)
    .maybeSingle();

  if (!booking?.artists?.email) {
    return NextResponse.json({ error: "Booking or artist email not found" }, { status: 404 });
  }

  // Clear any prior failed/sent marker so the send is allowed to run again.
  await admin.from("email_deliveries").delete().eq("booking_id", id).eq("email_type", "booking_confirmation");

  const dashboardUrl =
    (await provisionAndCreateAccessLink({
      artistId: booking.artist_id,
      email: booking.artists.email,
    })) ?? undefined;

  const outcome = await sendBookingConfirmationEmail(id, dashboardUrl);

  if (outcome.status === "failed") {
    return NextResponse.json({ error: outcome.detail ?? "Send failed" }, { status: 502 });
  }

  return NextResponse.json({ success: true, status: outcome.status });
}
