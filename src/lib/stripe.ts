import "server-only";
import Stripe from "stripe";
import { requireEnv } from "@/lib/env";

/**
 * Lazily constructed so `next build` (which executes module top-level code during
 * prerender) doesn't need secrets, while a missing key still throws a named error
 * at first use rather than silently becoming a placeholder that 401s later.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!client) {
    client = new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-07-29.dahlia",
      // The SDK otherwise picks its Node HTTP client, which has no working
      // transport on workerd — outbound calls to Stripe hang indefinitely with
      // no error and no log line. The fetch client is required on Workers and is
      // equally valid on Node 18+, so this is correct on both runtimes.
      httpClient: Stripe.createFetchHttpClient(),
    });
  }
  return client;
}

/** Preserves the existing `stripe.x.y()` call sites without eager construction. */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver);
  },
});
