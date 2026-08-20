import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminCrewSchema } from "@/lib/apiSchemas";

export async function POST(req: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseJson(req, adminCrewSchema);
  if (!parsed.ok) return parsed.response;
  const { name, email, phone, roles } = parsed.data;

  const { error } = await ctx.supabase
    .from("crew_members")
    .insert({ name, email, phone: phone ?? null, roles });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "There's already a crew member with that email." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
