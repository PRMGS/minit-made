"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FORMATS } from "@/lib/constants";
import type { Database } from "@/types/database.types";

type Batch = Database["public"]["Tables"]["shoot_batches"]["Row"];

export default function BatchesClient({ batches }: { batches: Batch[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    format: FORMATS[0].id as string,
    shoot_date: "",
    location: "",
    max_artists: 8,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    const res = await fetch("/api/admin/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) {
      setError(data.error);
    } else {
      setForm({ format: FORMATS[0].id, shoot_date: "", location: "", max_artists: 8 });
      router.refresh();
    }
    setCreating(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/batches/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function deleteBatch(id: string) {
    if (!confirm("Delete this batch?")) return;
    await fetch(`/api/admin/batches/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="card p-5 grid sm:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Format</label>
          <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Shoot Date</label>
          <input type="date" required className="input" value={form.shoot_date} onChange={(e) => setForm({ ...form, shoot_date: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Location</label>
          <input required className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Max Artists</label>
          <input type="number" min={1} className="input" value={form.max_artists} onChange={(e) => setForm({ ...form, max_artists: Number(e.target.value) })} />
        </div>
        <button type="submit" disabled={creating} className="btn-gold">
          {creating ? "Creating…" : "Create Batch"}
        </button>
      </form>
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="card divide-y divide-border">
        {batches.map((b) => (
          <div key={b.id} className="p-4 flex flex-wrap gap-3 justify-between items-center text-sm">
            <div>
              <p className="font-semibold">{b.format.replace(/_/g, " ")}</p>
              <p className="text-neutral-400">{b.shoot_date} · {b.location}</p>
            </div>
            <p className="text-neutral-500">{b.current_artists}/{b.max_artists} artists</p>
            <select
              value={b.status}
              onChange={(e) => updateStatus(b.id, e.target.value)}
              className="input w-auto"
            >
              {["open", "full", "in_progress", "completed", "cancelled"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button onClick={() => deleteBatch(b.id)} className="text-red-400 text-xs hover:underline">
              Delete
            </button>
          </div>
        ))}
        {batches.length === 0 && <p className="p-4 text-neutral-500 text-sm">No batches yet.</p>}
      </div>
    </div>
  );
}
