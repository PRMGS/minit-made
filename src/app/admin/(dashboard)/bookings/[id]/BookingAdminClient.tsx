"use client";

import { useState } from "react";
import { BOOKING_STATUSES } from "@/lib/constants";
import { ActionError, useAdminAction } from "@/lib/useAdminAction";
import type { Database } from "@/types/database.types";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type Batch = Database["public"]["Tables"]["shoot_batches"]["Row"];

export default function BookingAdminClient({ booking, batches }: { booking: Booking; batches: Batch[] }) {
  const { run, json, busy, error } = useAdminAction();
  const [status, setStatus] = useState(booking.status);
  const [batchId, setBatchId] = useState(booking.batch_id ?? "");
  const [slotTime, setSlotTime] = useState(booking.assigned_slot_time?.slice(0, 16) ?? "");
  const [notice, setNotice] = useState<string | null>(null);

  async function save() {
    setNotice(null);
    const ok = await run(
      `/api/admin/bookings/${booking.id}`,
      json({
        status,
        batch_id: batchId || null,
        assigned_slot_time: slotTime ? new Date(slotTime).toISOString() : null,
      })
    );
    if (ok) {
      setNotice(batchId ? "Saved. The artist has been emailed their shoot details." : "Saved.");
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <h2 className="font-bold text-gold">Production Assignment</h2>

      {booking.needs_scheduling && (
        <p className="text-sm text-gold border border-gold/40 bg-gold/5 rounded-lg p-3">
          This artist has paid and has no shoot assigned yet.
        </p>
      )}

      <div>
        <label htmlFor="booking-status" className="block text-xs text-neutral-500 mb-1">Status</label>
        <select
          id="booking-status"
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="booking-batch" className="block text-xs text-neutral-500 mb-1">Batch</label>
        <select
          id="booking-batch"
          className="input"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
        >
          <option value="">Unassigned</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.format.replace(/_/g, " ")} — {b.shoot_date} — {b.location} ({b.current_artists}/{b.max_artists})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="booking-slot" className="block text-xs text-neutral-500 mb-1">
          Assigned Call/Slot Time
        </label>
        <input
          id="booking-slot"
          type="datetime-local"
          className="input"
          value={slotTime}
          onChange={(e) => setSlotTime(e.target.value)}
        />
      </div>

      <ActionError message={error} />
      {notice && <p className="text-sm text-green-400">{notice}</p>}

      <button onClick={save} disabled={busy} className="btn-gold">
        {busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
