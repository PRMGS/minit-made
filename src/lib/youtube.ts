/**
 * Pulls the 11-character video id out of any of YouTube's url shapes.
 * Shared, because this regex was duplicated verbatim in the block renderer and
 * the admin content route and could drift between them.
 */
export function extractYoutubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/
  );
  return match ? match[1] : null;
}
