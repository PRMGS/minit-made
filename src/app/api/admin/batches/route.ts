import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminBatchSchema } from "@/lib/apiSchemas";
import { syncBatchToCalendar } from "@/lib/googleCalendar";

export async function POST(req: NextRequest) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseJson(req, adminBatchSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const { data, error } = await ctx.supabase
    .from("shoot_batches")
    .insert({
      format: body.format,
      shoot_date: body.shoot_date,
      location: body.location,
      max_artists: body.max_artists,
      week_number: body.week_number ?? null,
      month: body.month ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const sync = await syncBatchToCalendar(data.id);
  return NextResponse.json({ batch: data, calendarSync: sync.status });
}
