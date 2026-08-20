import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * Only allow same-origin relative paths. A bare `next` param on an
 * authenticated redirect is an open redirect: `//evil.com` is protocol-relative
 * and would send a freshly signed-in artist off-site.
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/artist/dashboard";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/artist/dashboard";
  return raw;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "magiclink") as EmailOtpType;
  const next = safeNext(url.searchParams.get("next"));

  if (!tokenHash) {
    return NextResponse.redirect(new URL("/artist/access?expired=1", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    // Expired or already-used link — send them somewhere they can get a new one.
    console.warn("[auth:callback] verifyOtp failed", { message: error.message });
    return NextResponse.redirect(new URL("/artist/access?expired=1", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
