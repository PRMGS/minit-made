import "server-only";
import { existsSync } from "fs";
import path from "path";
import { FORMATS } from "@/lib/constants";

export type FormatPreview = { poster?: string; video?: string };
export type PreviewMap = Record<string, FormatPreview>;

/**
 * Which format previews actually exist on disk.
 *
 * Referencing a file that isn't there costs eight failed requests on the
 * conversion step and fills the console with 404s. Resolved at build time —
 * /apply is statically rendered — so this is free at runtime, and dropping a
 * clip into public/formats still needs no code change, just a rebuild.
 */
export function availablePreviews(): PreviewMap {
  const dir = path.join(process.cwd(), "public", "formats");
  const map: PreviewMap = {};

  for (const format of FORMATS) {
    const poster = path.basename(format.poster);
    const video = path.basename(format.video);
    map[format.id] = {
      poster: existsSync(path.join(dir, poster)) ? format.poster : undefined,
      video: existsSync(path.join(dir, video)) ? format.video : undefined,
    };
  }

  return map;
}
