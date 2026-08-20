import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteUrlSafe } from "@/lib/env";

export const revalidate = 3600;

/** Static routes plus whatever the page builder has actually published. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrlSafe();

  const fixed: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/apply`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pages")
      .select("slug, updated_at")
      .eq("status", "published");

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
    // A sitemap is not worth failing a build or a request over.
    console.error("[sitemap] custom pages unavailable", e);
    return fixed;
  }
}
