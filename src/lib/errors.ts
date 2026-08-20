/**
 * Artist-facing error copy. Every message says what happened, what it means,
 * and what to do next — never a raw exception, DB string, or status code.
 *
 * Technical detail stays server-side (console) for debugging.
 */

export const SUPPORT_EMAIL = "bookings@minitmade.com";

export const ARTIST_ERRORS = {
  generic: `Something went sideways on our end. Give it another go — if it keeps happening, reach us at ${SUPPORT_EMAIL}.`,
  network: "We couldn't reach the server. Check your connection and try again.",
  badRequest: "That didn't come through properly — check your connection and send it again.",

  // Uploads
  uploadFailed: "That file didn't make it up. Give it another try.",
  /** Named limit, because "too big" without a number gives nobody a next step. */
  fileTooLarge: (maxBytes: number) =>
    `That file's too big — keep it under ${Math.round(maxBytes / (1024 * 1024))}MB and try again.`,
  invalidFile: "We couldn't read that file. Try an MP3, WAV, or M4A.",
  uploadRateLimited:
    "That's a lot of uploads in a short window. Give it a few minutes, then try again.",

  // Application / checkout
  termsRequired: "You'll need to accept the terms before we can lock your spot.",
  missingFields: "Some required details are missing — scroll back and fill in anything marked with *.",
  pricingUnavailable: `We couldn't load pricing for that format right now. Try again in a moment, or reach us at ${SUPPORT_EMAIL}.`,
  checkoutFailed: "We couldn't start checkout just now. Nothing's been charged — give it another try in a moment.",
  paymentFailed: "That payment didn't go through. Nothing's been charged. Check your card details and try again.",

  // Auth
  signedOut: "You've been signed out. Sign back in to pick up where you left off.",
  noAccountYet: "We don't have anything under that email yet. Apply first, then set up your account with the same email.",

  // Lookups
  bookingNotFound: "We couldn't find that one. It may have moved — check your list below.",
} as const;

/** Maps Supabase auth errors to artist-facing copy. Accurate, not vague. */
export function friendlyAuthError(raw: string | undefined | null): string {
  if (!raw) return ARTIST_ERRORS.generic;
  const m = raw.toLowerCase();

  if (m.includes("invalid login credentials") || m.includes("invalid credentials")) {
    return "That email and password don't match. Double-check and try again.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "There's already an account with that email. Try signing in instead.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirm your email first — check your inbox for the link we sent.";
  }
  if (m.includes("password") && (m.includes("short") || m.includes("at least") || m.includes("weak"))) {
    return "Use at least 8 characters for your password.";
  }
  if (m.includes("rate limit") || m.includes("for security purposes") || m.includes("too many")) {
    return "Too many tries just now. Wait a minute, then go again.";
  }
  // Supabase phrases this several ways, e.g. `Email address "x" is invalid`
  if (
    m.includes("unable to validate email") ||
    m.includes("invalid email") ||
    m.includes("email_address_invalid") ||
    (m.includes("email address") && m.includes("invalid"))
  ) {
    return "That email doesn't look right. Check it and try again.";
  }
  if (m.includes("fetch") || m.includes("network")) {
    return ARTIST_ERRORS.network;
  }
  return ARTIST_ERRORS.generic;
}

/**
 * Safe error for API responses. Logs the real cause server-side and returns
 * only artist-facing copy to the client.
 */
export function safeApiError(context: string, cause: unknown, message: string = ARTIST_ERRORS.generic) {
  console.error(`[${context}]`, cause);
  return message;
}

/** Reads a fetch() response body's error without ever surfacing raw internals. */
export function readApiError(data: unknown, fallback: string = ARTIST_ERRORS.generic): string {
  const msg = (data as { error?: unknown } | null)?.error;
  return typeof msg === "string" && msg.length > 0 && msg.length < 200 ? msg : fallback;
}

/**
 * Error whose message is already artist-safe copy. Only these are ever shown
 * verbatim — anything else falls back to generic copy so raw exceptions
 * (DOM errors, parser errors, DB strings) can never reach an artist.
 */
export class FriendlyError extends Error {}

/** Surfaces a caught error safely: our copy if trusted, generic otherwise. */
export function toFriendlyMessage(e: unknown, fallback: string = ARTIST_ERRORS.generic): string {
  if (e instanceof FriendlyError) return e.message;
  console.error("[unexpected]", e);
  return fallback;
}

/**
 * Parses a fetch Response that may not contain JSON at all (500s with empty or
 * HTML bodies). Returns a FriendlyError instead of letting .json() throw.
 */
export async function parseJsonResponse(
  res: Response,
  fallback: string = ARTIST_ERRORS.generic
): Promise<Record<string, unknown>> {
  let data: Record<string, unknown> = {};
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    console.error("[bad response body]", e);
    if (!res.ok) throw new FriendlyError(fallback);
    throw new FriendlyError(ARTIST_ERRORS.generic);
  }
  if (!res.ok) throw new FriendlyError(readApiError(data, fallback));
  return data;
}
