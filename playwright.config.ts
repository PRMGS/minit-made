import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke-level E2E coverage. Runs against a local `next dev` server, not
 * production or a shared staging deploy — nothing here should depend on real
 * Stripe/Resend/Supabase side effects, only navigation, rendering, and
 * client-side flow state up to (but not through) any external redirect.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
