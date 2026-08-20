import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminPageSchema } from "@/lib/apiSchemas";

export async function POST(req: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseJson(req, adminPageSchema);
  if (!parsed.ok) return parsed.response;
  const { slug, title, blocks } = parsed.data;

  const { data, error } = await ctx.supabase
    .from("pages")
    .insert({ slug, title, content: { blocks }, status: "draft" })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: `There's already a page at /${slug}.` }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ page: data });
}
