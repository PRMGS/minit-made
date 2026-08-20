import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminPagePatchSchema } from "@/lib/apiSchemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = await parseJson(req, adminPagePatchSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const update = { ...body } as Record<string, unknown>;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, unchanged: true });
  }
  if (update.status === "published") update.published_at = new Date().toISOString();

  const { data: current } = await ctx.supabase.from("pages").select("id").eq("id", id).maybeSingle();
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { error } = await ctx.supabase.from("pages").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Snapshot the published content so a bad edit can be traced back.
  if ("content" in body && update.status === "published") {
    const { data: lastVersion } = await ctx.supabase
      .from("page_versions")
      .select("version_number")
      .eq("page_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error: versionError } = await ctx.supabase.from("page_versions").insert({
      page_id: id,
      version_number: (lastVersion?.version_number ?? 0) + 1,
      content: body.content as never,
      published_by: ctx.admin.email,
    });
    if (versionError) {
      console.error("[admin:pages] version snapshot failed", { id, versionError });
    }
  }

  return NextResponse.json({ success: true });
}
