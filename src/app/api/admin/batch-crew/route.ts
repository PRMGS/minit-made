import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminBatchCrewSchema } from "@/lib/apiSchemas";
import { syncBatchToCalendar } from "@/lib/googleCalendar";

export async function POST(req: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseJson(req, adminBatchCrewSchema);
  if (!parsed.ok) return parsed.response;
  const { batch_id, crew_id, role } = parsed.data;

  const { error } = await ctx.supabase
    .from("shoot_batch_crew")
    .insert({ batch_id, crew_id, role: role ?? null });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "That crew member is already on this shoot." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sync = await syncBatchToCalendar(batch_id);
  return NextResponse.json({ success: true, calendarSync: sync.status });
}
