import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { exchangeCodeForTokens, createDedicatedCalendar, saveIntegration } from "@/lib/googleCalendar";
import { siteUrl } from "@/lib/env";

const STATE_COOKIE = "gcal_oauth_state";
const SETTINGS_PATH = "/admin/settings/calendar";

// This is a full-page browser redirect from Google, not a fetch call, so
// failures redirect to the settings page (with an error param) rather than
// returning JSON — matching how every other browser-navigated auth route in
// this codebase (e.g. /auth/callback) behaves.
export async function GET(req: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.redirect(`${siteUrl()}/admin/login`);

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");
  const cookieState = req.cookies.get(STATE_COOKIE)?.value;

  function fail(reason: string) {
    const res = NextResponse.redirect(`${siteUrl()}${SETTINGS_PATH}?error=${reason}`);
    res.cookies.delete(STATE_COOKIE);
    return res;
  }

  if (oauthError) return fail("access_denied");
  if (!code || !state || !cookieState || state !== cookieState) return fail("state_mismatch");

  const redirectUri = `${siteUrl()}/api/admin/calendar/callback`;
  const tokens = await exchangeCodeForTokens(code, redirectUri);
  if (!tokens) return fail("token_exchange_failed");

  // access_type=offline + prompt=consent should always yield one, but a prior
  // ungoverned grant can suppress it — the settings page explains the fix.
  if (!tokens.refreshToken) return fail("no_refresh_token");

  const calendar = await createDedicatedCalendar(tokens.accessToken);
  if (!calendar) return fail("calendar_creation_failed");

  await saveIntegration({
    refreshToken: tokens.refreshToken,
    calendarId: calendar.id,
    connectedBy: ctx.admin.email,
  });

  const res = NextResponse.redirect(`${siteUrl()}${SETTINGS_PATH}?connected=1`);
  res.cookies.delete(STATE_COOKIE);
  return res;
}
