import type { MetadataRoute } from "next";
import { siteUrlSafe } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Portals and the API hold personal data and have nothing to index.
        disallow: ["/admin", "/artist", "/crew", "/api", "/apply/confirmed", "/auth"],
      },
    ],
    sitemap: `${siteUrlSafe()}/sitemap.xml`,
  };
}
