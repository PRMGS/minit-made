import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Minimal confirmation probe for the post-checkout page.
 *
 * Returns only `{ confirmed: boolean }` — never booking details — and requires
 * the Stripe session id as proof, so a guessed booking id reveals nothing.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ confirmed: false }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.booking_id !== id) {
      return NextResponse.json({ confirmed: false }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("bookings")
      .select("payment_status")
      .eq("id", id)
      .maybeSingle();

    return NextResponse.json({ confirmed: data?.payment_status === "completed" });
  } catch (e) {
    console.error("[booking:status] failed", { id, error: e });
    return NextResponse.json({ confirmed: false });
  }
}
