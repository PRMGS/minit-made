"use client";

import { useState } from "react";
import { FORMATS } from "@/lib/constants";
import { ActionError, useAdminAction } from "@/lib/useAdminAction";
import type { Database } from "@/types/database.types";

type Batch = Database["public"]["Tables"]["shoot_batches"]["Row"];

const BATCH_STATUSES = ["open", "full", "in_progress", "completed", "cancelled"] as const;

const EMPTY = { format: FORMATS[0].id as string, shoot_date: "", location: "", max_artists: 8 };

export default function BatchesClient({ batches }: { batches: Batch[] }) {
  const { run, json, busy, error } = useAdminAction();
  const [form, setForm] = useState(EMPTY);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const ok = await run("/api/admin/batches", json(form, "POST"));
    if (ok) setForm(EMPTY);
  }

  const updateStatus = (id: string, status: string) =>
    run(`/api/admin/batches/${id}`, json({ status }));

  async function deleteBatch(id: string, label: string) {
    if (!confirm(`Delete the ${label} shoot? This can't be undone.`)) return;
    await run(`/api/admin/batches/${id}`, { method: "DELETE" });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="card p-5 grid sm:grid-cols-5 gap-3 items-end">
        <div>
          <label htmlFor="batch-format" className="block text-xs text-neutral-500 mb-1">Format</label>
          <select
            id="batch-format"
            className="input"
            value={form.format}
            onChange={(e) => setForm({ ...form, format: e.target.value })}
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="batch-date" className="block text-xs text-neutral-500 mb-1">Shoot Date</label>
          <input
            id="batch-date"
            type="date"
            required
            className="input"
            value={form.shoot_date}
            onChange={(e) => setForm({ ...form, shoot_date: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="batch-location" className="block text-xs text-neutral-500 mb-1">Location</label>
          <input
            id="batch-location"
            required
            className="input"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="batch-max" className="block text-xs text-neutral-500 mb-1">Max Artists</label>
          <input
            id="batch-max"
            type="number"
            min={1}
            className="input"
            value={form.max_artists}
            onChange={(e) => setForm({ ...form, max_artists: Number(e.target.value) })}
          />
        </div>
        <button type="submit" disabled={busy} className="btn-gold">
          {busy ? "Saving…" : "Create Batch"}
        </button>
      </form>

      <ActionError message={error} />

      <div className="card divide-y divide-border">
        {batches.map((b) => (
          <div key={b.id} className="p-4 flex flex-wrap gap-3 justify-between items-center text-sm">
            <div>
              <p className="font-semibold">{b.format.replace(/_/g, " ")}</p>
              <p className="text-neutral-400">{b.shoot_date} · {b.location}</p>
            </div>
            <p className={`text-neutral-500 tabular-nums ${b.current_artists >= b.max_artists ? "text-gold" : ""}`}>
              {b.current_artists}/{b.max_artists} artists
            </p>
            <label className="sr-only" htmlFor={`batch-status-${b.id}`}>Status</label>
            <select
              id={`batch-status-${b.id}`}
              value={b.status}
              onChange={(e) => updateStatus(b.id, e.target.value)}
              className="input w-auto"
            >
              {BATCH_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <button
              onClick={() => deleteBatch(b.id, `${b.format.replace(/_/g, " ")} on ${b.shoot_date}`)}
              className="text-red-400 text-xs hover:underline"
            >
              Delete
            </button>
          </div>
        ))}
        {batches.length === 0 && <p className="p-4 text-neutral-500 text-sm">No batches yet.</p>}
      </div>
    </div>
  );
}
