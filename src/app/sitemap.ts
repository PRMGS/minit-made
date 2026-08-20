import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { siteUrlSafe } from "@/lib/env";

export const revalidate = 3600;

/**
 * Static routes plus whatever the page builder has actually published.
 *
 * Uses a cookie-free anon client rather than the request-scoped one: reading
 * cookies opts the route into dynamic rendering, which made the query throw
 * during the build and silently drop every custom page from the sitemap. RLS
 * still applies, and `pages_public_select` exposes published pages to anon —
 * which is exactly the set a sitemap should list.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrlSafe();

  const fixed: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/apply`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fixed;

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("pages")
      .select("slug, updated_at")
      .eq("status", "published");

    if (error) throw error;

    const reserved = new Set(["home", "faq", "terms", "privacy"]);
    const custom = (data ?? [])
      .filter((p) => !reserved.has(p.slug))
      .map((p) => ({
        url: `${base}/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    return [...fixed, ...custom];
  } catch (e) {
    // A sitemap is never worth failing a build or a request over.
    console.error("[sitemap] custom pages unavailable", e);
    return fixed;
  }
}
