import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { linkAuthUserToRecord } from "@/lib/accountLink";
import { safeNext } from "@/lib/safeNext";
import type { EmailOtpType } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * Single landing point for every emailed sign-in link.
 *
 * Two shapes arrive here:
 *   - `token_hash` — magic links we mint ourselves and deliver through Resend.
 *   - `code`       — Supabase's own PKCE links (password recovery), where the
 *                    verifier lives in a cookie this route can read.
 *
 * Recovery previously pointed straight at /artist/login, which has no way to
 * consume either shape, so a reset link dropped the artist back on the form they
 * were already locked out of.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const code = url.searchParams.get("code");
  const type = (url.searchParams.get("type") ?? "magiclink") as EmailOtpType;
  const next = safeNext(url.searchParams.get("next"), "/artist/dashboard");

  const expired = () => NextResponse.redirect(new URL("/artist/access?expired=1", url.origin));

  if (!tokenHash && !code) return expired();

  const supabase = await createClient();

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type, token_hash: tokenHash! });

  if (error) {
    // Expired or already-used link — send them somewhere they can get a new one.
    console.warn("[auth:callback] verification failed", { flow: code ? "code" : "token_hash", message: error.message });
    return expired();
  }

  // Best-effort account link (e.g. a just-confirmed signup, or a returning
  // artist's first magic-link visit). Idempotent and never blocks the
  // redirect — a failure here just means the dashboard will ask again.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    try {
      await linkAuthUserToRecord(createAdminClient(), { id: user.id, email: user.email });
    } catch (e) {
      console.error("[auth:callback] link failed", e);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
