/**
 * Runs once per server start, before any request is served.
 *
 * Production: refuse to boot on a bad environment, so a misconfigured deploy
 * fails visibly instead of taking live traffic with a placeholder credential.
 * Development: warn only, so a fresh clone still runs without every secret.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { validateEnv, formatEnvIssues } = await import("@/lib/env");
  const isProduction = process.env.NODE_ENV === "production";
  const result = validateEnv(isProduction);

  if (result.success) return;

  const detail = formatEnvIssues(result.error);

  if (isProduction) {
    throw new Error(`Invalid environment configuration — refusing to start:\n${detail}`);
  }

  console.warn(
    `[env] Incomplete environment (development). Payment/email features will fail until these are set:\n${detail}`
  );
}
