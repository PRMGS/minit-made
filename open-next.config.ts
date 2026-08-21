import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * No incrementalCache override is set on purpose.
 *
 * The R2-backed cache is the documented choice, but an R2 bucket requires a
 * payment method, and this deployment is deliberately on the free tier. The only
 * route that revalidates is /sitemap.xml at 1h, which is cheap to regenerate.
 *
 * If ISR becomes load-bearing, add an R2 bucket bound as NEXT_INC_CACHE_R2_BUCKET
 * in wrangler.jsonc and set `incrementalCache: r2IncrementalCache` here.
 */
export default defineCloudflareConfig({});
