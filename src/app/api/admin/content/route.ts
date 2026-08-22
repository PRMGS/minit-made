import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminContentSchema } from "@/lib/apiSchemas";
import { extractYoutubeId } from "@/lib/youtube";
import { sendContentLiveEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseJson(req, adminContentSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const youtubeId = body.youtube_url ? extractYoutubeId(body.youtube_url) : null;

  const { data, error } = await ctx.supabase
    .from("content_items")
    .insert({
      booking_id: body.booking_id,
      artist_id: body.artist_id,
      format: body.format ?? null,
      title: body.title,
      description: body.description ?? null,
      youtube_url: body.youtube_url ?? null,
      youtube_video_id: youtubeId,
      youtube_playlist_url: body.youtube_playlist_url ?? null,
      thumbnail_url: body.thumbnail_url ?? (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null),
      content_type: body.content_type,
      status: body.status,
      featured: body.featured,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Publishing is the moment the artist has been waiting for. Failure to notify
  // must not fail the publish, so the outcome is reported rather than thrown.
  let notified: string | undefined;
  if (body.status === "live" && data?.id) {
    const outcome = await sendContentLiveEmail(data.id);
    notified = outcome.status;
    if (outcome.status === "failed") {
      console.error("[admin:content] live email failed", { id: data.id, detail: outcome.detail });
    }
  }

  return NextResponse.json({ success: true, id: data?.id, notified });
}
