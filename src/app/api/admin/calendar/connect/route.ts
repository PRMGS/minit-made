import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { calendarOAuthUrl } from "@/lib/googleCalendar";
import { siteUrl } from "@/lib/env";

const STATE_COOKIE = "gcal_oauth_state";

export async function GET() {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state = crypto.randomUUID();
  const redirectUri = `${siteUrl()}/api/admin/calendar/callback`;

  const res = NextResponse.redirect(calendarOAuthUrl(state, redirectUri));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: siteUrl().startsWith("https://"),
    sameSite: "lax",
    maxAge: 600,
    path: "/api/admin/calendar",
  });
  return res;
}
