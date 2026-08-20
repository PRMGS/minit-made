import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createMagicLinkUrl } from "@/lib/artistAccount";
import { sendMagicLinkEmail } from "@/lib/email";

export const runtime = "nodejs";

// Small in-memory throttle. Not durable across instances, but enough to stop
// casual abuse of an unauthenticated send endpoint.
const attempts = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

/**
 * "Email me a sign-in link."
 *
 * Always returns the same success shape whether or not the email matches an
 * artist, so this cannot be used to enumerate who has booked.
 */
export async function POST(req: NextRequest) {
  const { email } = (await req.json().catch(() => ({}))) as { email?: string };

  const generic = NextResponse.json({
    success: true,
    message: "If that email is on a booking, a sign-in link is on its way.",
  });

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "That email doesn't look right. Check it and try again." },
      { status: 400 }
    );
  }

  const normalized = email.trim().toLowerCase();
  if (rateLimited(normalized)) return generic;

  try {
    const admin = createAdminClient();
    const { data: artist } = await admin
      .from("artists")
      .select("id, artist_name")
      .eq("email", normalized)
      .maybeSingle();

    if (artist) {
      const url = await createMagicLinkUrl(normalized);
      if (url) await sendMagicLinkEmail(normalized, artist.artist_name, url);
    }
  } catch (e) {
    // Still return the generic response: failures must not reveal whether the
    // address exists.
    console.error("[auth:magic-link] failed", { error: e });
  }

  return generic;
}
