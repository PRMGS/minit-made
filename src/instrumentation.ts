/**
 * Runs once per server start, before any request is served.
 *
 * Anything served over the internet — production or a staging preview — refuses
 * to boot on a bad environment, so a misconfigured deploy fails visibly instead
 * of taking traffic with a placeholder credential. Local development warns only,
 * so a fresh clone still runs without every secret present.
 *
 * Staging is held to the same completeness bar as production and differs only in
 * allowing test Stripe keys; see currentTier() in lib/env.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { validateEnv, formatEnvIssues, currentTier } = await import("@/lib/env");
  const tier = currentTier();
  const result = validateEnv(tier);

  if (result.success) return;

  const detail = formatEnvIssues(result.error);

  if (tier === "development") {
    console.warn(
      `[env] Incomplete environment (development). Payment/email features will fail until these are set:\n${detail}`
    );
    return;
  }

  throw new Error(`Invalid environment configuration for ${tier} — refusing to start:\n${detail}`);
}
