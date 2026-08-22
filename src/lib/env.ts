import "server-only";
import { z } from "zod";

/**
 * Server-side environment validation.
 *
 * The rule this file exists to enforce: a missing or placeholder credential must
 * fail at boot, not at the moment an artist clicks Pay. Previously
 * `STRIPE_SECRET_KEY ?? "sk_test_placeholder"` meant a misconfigured deploy
 * looked healthy right up until the first real transaction.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so they are referenced here as
 * full literals (never computed keys) or the bundler cannot substitute them.
 */

const baseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_", "must start with sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_", "must start with whsec_"),
  RESEND_API_KEY: z.string().startsWith("re_", "must start with re_"),
  EMAIL_FROM: z.string().email(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  GOOGLE_OAUTH_CLIENT_ID: z.string().min(1),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1),
});

/**
 * Which deployment this is.
 *
 * There are three tiers, not two. The original split — production or not — made
 * a viewable staging deploy impossible: Vercel builds previews with
 * NODE_ENV=production, so a preview tripped the sk_live_ rule and refused to
 * boot. Staging keeps every "is it configured at all" check and drops only the
 * two that assume real money.
 *
 * APP_ENV overrides everything, so a local production build can be exercised
 * without pretending to be the live site.
 */
export type AppTier = "development" | "staging" | "production";

export function currentTier(): AppTier {
  const explicit = process.env.APP_ENV;
  if (explicit === "production" || explicit === "staging" || explicit === "development") {
    return explicit;
  }
  if (process.env.VERCEL_ENV === "production") return "production";
  if (process.env.VERCEL_ENV) return "staging"; // preview and branch deploys
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/** Rules for anything served over the internet, test keys included. */
const deployedSchema = baseSchema
  .refine((e) => e.NEXT_PUBLIC_SITE_URL.startsWith("https://"), {
    path: ["NEXT_PUBLIC_SITE_URL"],
    message: "must be https:// once deployed (Stripe redirects and email links derive from it)",
  })
  .refine((e) => !e.NEXT_PUBLIC_SITE_URL.includes("localhost"), {
    path: ["NEXT_PUBLIC_SITE_URL"],
    message: "must not point at localhost once deployed — links we email would be dead",
  });

/** Extra rules that only make sense where real cards are charged. */
const productionSchema = deployedSchema.refine(
  (e) => e.STRIPE_SECRET_KEY.startsWith("sk_live_"),
  {
    path: ["STRIPE_SECRET_KEY"],
    message: "must be a live key (sk_live_) in production",
  }
);

function rawEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  };
}

export function formatEnvIssues(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
}

/**
 * Validates the whole environment against the rules for this tier. Used by
 * instrumentation at boot. Returns the parse result rather than throwing so the
 * caller decides severity.
 */
export function validateEnv(tier: AppTier = currentTier()) {
  const schema =
    tier === "production" ? productionSchema : tier === "staging" ? deployedSchema : baseSchema;
  return schema.safeParse(rawEnv());
}

/**
 * Reads one required variable at point of use. Throws a named, actionable error
 * instead of silently substituting a placeholder.
 */
export function requireEnv(name: keyof z.infer<typeof baseSchema>): string {
  const value = rawEnv()[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it in .env.local (see .env.example).`
    );
  }
  return value;
}

/** Site origin used for Stripe redirects and every link we email. */
export function siteUrl(): string {
  return requireEnv("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
}

/**
 * Same origin, but never throws.
 *
 * Root metadata is evaluated during `next build`, including for static pages, so
 * a hard failure here would break the build rather than surface a config error
 * at boot — which is instrumentation's job.
 */
export function siteUrlSafe(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return raw && /^https?:\/\//.test(raw) ? raw : "http://localhost:3000";
}
