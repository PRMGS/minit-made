import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const allowed = ["title", "meta_description", "content", "status"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) update[key] = body[key];
  if (update.status === "published") update.published_at = new Date().toISOString();

  const { data: current } = await ctx.supabase.from("pages").select("*").eq("id", id).single();
  const { error } = await ctx.supabase.from("pages").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (current && "content" in body && update.status === "published") {
    const { data: lastVersion } = await ctx.supabase
      .from("page_versions")
      .select("version_number")
      .eq("page_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    await ctx.supabase.from("page_versions").insert({
      page_id: id,
      version_number: (lastVersion?.version_number ?? 0) + 1,
      content: body.content,
      published_by: ctx.admin.email,
    });
  }

  return NextResponse.json({ success: true });
}
