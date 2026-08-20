/**
 * Validates a `next` redirect target taken from the query string.
 *
 * A bare `next` on a post-authentication navigation is an open redirect: both
 * `https://evil.com` and the protocol-relative `//evil.com` send a freshly
 * signed-in artist off-site. A backslash counts too — browsers normalise
 * `/\evil.com` to `//evil.com`.
 *
 * Shared by the auth callback and both login pages so the rule is written once.
 */
export function safeNext(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (raw.includes("\\")) return fallback;
  return raw;
}
