import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncBatchToCalendar, deleteBatchCalendarEvent } from "@/lib/googleCalendar";

/**
 * Backfills batches created before the integration existed and repairs drift
 * (e.g. an event deleted by hand in Google's UI). Sequential, not parallel —
 * stays under Google's per-user rate limits and keeps this readable for the
 * handful of batches a small studio runs.
 */
export async function POST() {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: batches, error } = await admin.from("shoot_batches").select("id, status");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let synced = 0;
  let skipped = 0;
  let failed = 0;
  const errors: { batchId: string; detail?: string }[] = [];

  for (const batch of batches ?? []) {
    const outcome =
      batch.status === "cancelled"
        ? await deleteBatchCalendarEvent(batch.id)
        : await syncBatchToCalendar(batch.id);

    if (outcome.status === "synced") synced++;
    else if (outcome.status === "skipped") skipped++;
    else {
      failed++;
      errors.push({ batchId: batch.id, detail: outcome.detail });
    }
  }

  return NextResponse.json({ synced, skipped, failed, errors });
}
