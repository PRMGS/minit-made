import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminAddonPatchSchema } from "@/lib/apiSchemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = await parseJson(req, adminAddonPatchSchema);
  if (!parsed.ok) return parsed.response;

  const update = parsed.data as Record<string, unknown>;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, unchanged: true });
  }

  const { error } = await ctx.supabase.from("add_on_orders").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
