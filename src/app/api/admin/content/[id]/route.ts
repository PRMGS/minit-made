import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminContentPatchSchema } from "@/lib/apiSchemas";
import { extractYoutubeId } from "@/lib/youtube";
import { sendContentLiveEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = await parseJson(req, adminContentPatchSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const update = { ...body } as Record<string, unknown>;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, unchanged: true });
  }

  // Keep the derived id in step with the url it came from.
  if ("youtube_url" in body) {
    update.youtube_video_id = body.youtube_url ? extractYoutubeId(body.youtube_url) : null;
  }

  const { error } = await ctx.supabase.from("content_items").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let notified: string | undefined;
  if (body.status === "live") {
    const outcome = await sendContentLiveEmail(id);
    notified = outcome.status;
    if (outcome.status === "failed") {
      console.error("[admin:content] live email failed", { id, detail: outcome.detail });
    }
  }

  return NextResponse.json({ success: true, notified });
}
