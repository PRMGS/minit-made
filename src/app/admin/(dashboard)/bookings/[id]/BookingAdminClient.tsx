"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BOOKING_STATUSES } from "@/lib/constants";
import type { Database } from "@/types/database.types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type Batch = Database["public"]["Tables"]["shoot_batches"]["Row"];

export default function BookingAdminClient({ booking, batches }: { booking: Booking; batches: Batch[] }) {
  const router = useRouter();
  const [status, setStatus] = useState(booking.status);
  const [batchId, setBatchId] = useState(booking.batch_id ?? "");
  const [slotTime, setSlotTime] = useState(booking.assigned_slot_time?.slice(0, 16) ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        batch_id: batchId || null,
        assigned_slot_time: slotTime ? new Date(slotTime).toISOString() : null,
      }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="card p-5 space-y-4">
      <h2 className="font-bold text-gold">Production Assignment</h2>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Status</label>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Batch</label>
        <select className="input" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
          <option value="">Unassigned</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.format} — {b.shoot_date} — {b.location}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Assigned Call/Slot Time</label>
        <input type="datetime-local" className="input" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} />
      </div>
      <button onClick={save} disabled={saving} className="btn-gold">
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
