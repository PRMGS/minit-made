import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";

function extractYoutubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const { error } = await ctx.supabase.from("content_items").insert({
    booking_id: body.booking_id || null,
    artist_id: body.artist_id,
    format: body.format ?? null,
    title: body.title,
    description: body.description ?? null,
    youtube_url: body.youtube_url ?? null,
    youtube_video_id: body.youtube_url ? extractYoutubeId(body.youtube_url) : null,
    youtube_playlist_url: body.youtube_playlist_url ?? null,
    thumbnail_url: body.thumbnail_url ?? null,
    content_type: body.content_type ?? "performance",
    status: body.status ?? "pending",
    featured: !!body.featured,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
