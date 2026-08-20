import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";

const EDITABLE_FIELDS = [
  "video_production_price",
  "audio_mix_price",
  "audio_mix_master_base_price",
  "bts_price",
  "broll_price",
  "photoshoot_price",
  "epk_basic_price",
  "epk_full_price",
  "interview_price",
  "active",
  "notes",
];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { supabase, admin } = ctx;

  const { data: current } = await supabase.from("pricing_config").select("*").eq("id", id).single();
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update: Record<string, unknown> = {};
  const historyRows: {
    pricing_config_id: string;
    field_changed: string;
    previous_value: string;
    new_value: string;
    changed_by: string;
    reason: string | null;
  }[] = [];

  for (const key of EDITABLE_FIELDS) {
    if (key in body && String(body[key]) !== String((current as Record<string, unknown>)[key])) {
      update[key] = body[key];
      historyRows.push({
        pricing_config_id: id,
        field_changed: key,
        previous_value: String((current as Record<string, unknown>)[key]),
        new_value: String(body[key]),
        changed_by: admin.email,
        reason: body.reason ?? null,
      });
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, unchanged: true });
  }

  const { error } = await supabase.from("pricing_config").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (historyRows.length) {
    await supabase.from("pricing_history").insert(historyRows);
  }

  return NextResponse.json({ success: true });
}
