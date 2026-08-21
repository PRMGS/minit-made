import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/**
 * Allow next/image to optimise the images we actually serve: Supabase Storage
 * for artist uploads and content thumbnails, and YouTube for video posters.
 *
 * The Supabase host is derived from the project URL rather than hardcoded, so
 * pointing at a different project doesn't silently break every image. Narrow
 * patterns on purpose — a wide one turns the optimiser into an open proxy.
 */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(supabaseHost
        ? ([
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/**",
            },
          ])
        : []),
      { protocol: "https" as const, hostname: "i.ytimg.com", pathname: "/**" },
      { protocol: "https" as const, hostname: "img.youtube.com", pathname: "/**" },
    ],
  },
};

export default nextConfig;

/**
 * Makes Cloudflare bindings available during `next dev`, so local development
 * behaves like the deployed worker rather than diverging from it.
 */
initOpenNextCloudflareForDev();
