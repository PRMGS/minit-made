import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseJson } from "@/lib/apiRequest";
import { adminBookingPatchSchema } from "@/lib/apiSchemas";
import { sendShootScheduledEmail } from "@/lib/email";
import { syncBatchToCalendar } from "@/lib/googleCalendar";

export const runtime = "nodejs";

/**
 * Scheduling goes through `reassign_booking_batch`, which releases the old
 * batch's seat, claims the new one and clears needs_scheduling in a single
 * transaction. A bare UPDATE here left `current_artists` untouched, so manual
 * assignment silently oversold the batch.
 *
 * The RPC is granted to service_role only, so it runs on the admin client after
 * requireAdminApi has authorised the caller — rather than being reachable by any
 * signed-in user through PostgREST.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = await parseJson(req, adminBookingPatchSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const touchesSchedule = "batch_id" in body || "assigned_slot_time" in body;

  if (touchesSchedule) {
    const admin = createAdminClient();

    // Read before the RPC moves it — the RPC's return value doesn't carry the
    // prior batch_id, and the old batch's Calendar roster needs updating too.
    const { data: existing } = await admin.from("bookings").select("batch_id").eq("id", id).maybeSingle();
    const oldBatchId = existing?.batch_id ?? null;

    const { data, error } = await admin.rpc("reassign_booking_batch", {
      p_booking_id: id,
      p_batch_id: body.batch_id ?? null,
      p_slot_time: body.assigned_slot_time ?? null,
      p_status: body.status ?? null,
    } as never);

    if (error) {
      const full = error.message?.includes("batch_unavailable");
      console.error("[admin:booking] reassign failed", { id, error });
      return NextResponse.json(
        {
          error: full
            ? "That shoot is already full. Free a slot or pick another date."
            : "Couldn't update that booking. Try again.",
        },
        { status: full ? 409 : 500 }
      );
    }

    const outcome = data as { result?: string } | null;
    if (outcome?.result === "booking_not_found") {
      return NextResponse.json({ error: "That booking no longer exists." }, { status: 404 });
    }

    // payment_status is deliberately not part of the scheduling transaction.
    if ("payment_status" in body) {
      const { error: payErr } = await ctx.supabase
        .from("bookings")
        .update({ payment_status: body.payment_status } as never)
        .eq("id", id);
      if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });
    }

    // The artist's booking page promises "we'll send your exact time before the
    // shoot" and nothing ever did. Notifying must not fail the assignment, so
    // the outcome is reported rather than thrown.
    let notified: string | undefined;
    if (body.batch_id) {
      const outcome = await sendShootScheduledEmail(id);
      notified = outcome.status;
      if (outcome.status === "failed") {
        console.error("[admin:booking] scheduling email failed", { id, detail: outcome.detail });
      }
    }

    // Roster changed on whichever batches were involved — sync both so an
    // artist moving between batches disappears from one event and appears on
    // the other. De-duped so an unchanged batch_id only syncs once.
    const newBatchId = body.batch_id ?? null;
    const batchIdsToSync = [...new Set([oldBatchId, newBatchId].filter((v): v is string => Boolean(v)))];
    const syncResults = await Promise.allSettled(batchIdsToSync.map((batchId) => syncBatchToCalendar(batchId)));
    const calendarSync = !batchIdsToSync.length
      ? "skipped"
      : syncResults.some((r) => r.status === "fulfilled" && r.value.status === "failed")
        ? "failed"
        : "synced";

    return NextResponse.json({ success: true, notified, calendarSync });
  }

  const update: Record<string, unknown> = {};
  if ("status" in body) update.status = body.status;
  if ("payment_status" in body) update.payment_status = body.payment_status;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, unchanged: true });
  }

  const { error } = await ctx.supabase.from("bookings").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
