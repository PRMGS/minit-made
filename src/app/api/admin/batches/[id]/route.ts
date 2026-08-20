import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth";
import { parseJson } from "@/lib/apiRequest";
import { adminBatchPatchSchema } from "@/lib/apiSchemas";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Was `update(body)` with no allowlist, so every column was writable —
  // current_artists included, which must only move through claim_batch_slot.
  const parsed = await parseJson(req, adminBatchPatchSchema);
  if (!parsed.ok) return parsed.response;

  const update = parsed.data as Record<string, unknown>;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, unchanged: true });
  }

  const { error } = await ctx.supabase.from("shoot_batches").update(update as never).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAdminApi();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  // Refuse to delete a batch people have paid to be on.
  const { count } = await ctx.supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", id)
    .eq("payment_status", "completed");

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `That shoot has ${count} paid artist${count === 1 ? "" : "s"} on it. Move them before deleting it.` },
      { status: 409 }
    );
  }

  const { error } = await ctx.supabase.from("shoot_batches").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
