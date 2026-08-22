import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminSettingSchema } from "@/lib/apiSchemas";

export async function PATCH(req: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseJson(req, adminSettingSchema);
  if (!parsed.ok) return parsed.response;
  const { key, value } = parsed.data;

  const { error } = await ctx.supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() } as never, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
