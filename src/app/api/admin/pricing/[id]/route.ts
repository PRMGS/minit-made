import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminPricingPatchSchema } from "@/lib/apiSchemas";

const MONEY_FIELDS = [
  "video_production_price",
  "audio_mix_price",
  "audio_mix_master_base_price",
  "bts_price",
  "broll_price",
  "photoshoot_price",
  "epk_basic_price",
  "epk_full_price",
  "interview_price",
] as const;

/** Prices are integer cents. A float or a negative here is a real-money bug. */
function coerceCents(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (!Number.isInteger(n) || n < 0 || n > 100_000_00) return null;
  return n;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { supabase, admin } = ctx;

  const parsed = await parseJson(req, adminPricingPatchSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data as Record<string, unknown>;

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

  const record = (key: string, value: unknown) => {
    const before = (current as Record<string, unknown>)[key];
    if (String(value) === String(before)) return;
    update[key] = value;
    historyRows.push({
      pricing_config_id: id,
      field_changed: key,
      previous_value: String(before),
      new_value: String(value),
      changed_by: admin.email,
      reason: (body.reason as string | undefined) ?? null,
    });
  };

  for (const key of MONEY_FIELDS) {
    if (!(key in body)) continue;
    const cents = coerceCents(body[key]);
    if (cents === null) {
      return NextResponse.json(
        { error: `${key.replace(/_/g, " ")} must be a whole number of cents, zero or more.` },
        { status: 400 }
      );
    }
    record(key, cents);
  }

  if ("active" in body) {
    if (typeof body.active !== "boolean") {
      return NextResponse.json({ error: "active must be true or false." }, { status: 400 });
    }
    record("active", body.active);
  }

  if ("notes" in body) {
    const notes = body.notes == null ? null : String(body.notes).slice(0, 2000);
    record("notes", notes);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, unchanged: true });
  }

  const { error } = await supabase.from("pricing_config").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (historyRows.length) {
    const { error: historyError } = await supabase.from("pricing_history").insert(historyRows);
    // A missing audit row must be visible, not silent — but the price did change.
    if (historyError) console.error("[admin:pricing] history write failed", { id, historyError });
  }

  return NextResponse.json({ success: true });
}
