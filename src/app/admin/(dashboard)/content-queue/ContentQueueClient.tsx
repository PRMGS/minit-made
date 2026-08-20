"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ADD_ON_TYPES } from "@/lib/constants";
import type { Database } from "@/types/database.types";

type AddOnOrder = Database["public"]["Tables"]["add_on_orders"]["Row"] & {
  bookings: { artist_id: string; format: string; artists: { artist_name: string } | null } | null;
};
type Crew = Database["public"]["Tables"]["crew_members"]["Row"];

const STATUSES = ["pending", "in_production", "ready", "delivered"];

export function AddOnQueue({ orders, crew }: { orders: AddOnOrder[]; crew: Crew[] }) {
  const router = useRouter();

  async function update(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/admin/addons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="card p-4 flex flex-wrap gap-3 justify-between items-center text-sm">
          <div>
            <p className="font-semibold">{ADD_ON_TYPES.find((d) => d.id === o.add_on_type)?.label ?? o.add_on_type}</p>
            <p className="text-neutral-500">{o.bookings?.artists?.artist_name}</p>
          </div>
          <select value={o.production_status} onChange={(e) => update(o.id, { production_status: e.target.value })} className="input w-auto">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={o.assigned_crew_id ?? ""}
            onChange={(e) => update(o.id, { assigned_crew_id: e.target.value || null })}
            className="input w-auto"
          >
            <option value="">Unassigned</option>
            {crew.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            type="date"
            className="input w-auto"
            value={o.due_date ?? ""}
            onChange={(e) => update(o.id, { due_date: e.target.value || null })}
          />
        </div>
      ))}
      {!orders.length && <p className="text-neutral-500 text-sm">No add-on orders yet.</p>}
    </div>
  );
}

export function UploadContentForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    artist_id: "",
    booking_id: "",
    title: "",
    content_type: "performance",
    youtube_url: "",
    youtube_playlist_url: "",
    featured: false,
    status: "live",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else {
      setForm({ ...form, title: "", youtube_url: "", booking_id: "" });
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-3">
      <h2 className="font-bold text-gold mb-2">Upload Content</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <input required placeholder="Artist ID" className="input" value={form.artist_id} onChange={(e) => setForm({ ...form, artist_id: e.target.value })} />
        <input placeholder="Booking ID (optional)" className="input" value={form.booking_id} onChange={(e) => setForm({ ...form, booking_id: e.target.value })} />
        <input required placeholder="Title" className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className="input" value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value })}>
          {["performance", "freestyle", "cypher", "city_spotlight", "bts", "broll", "interview"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input placeholder="YouTube URL" className="input" value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} />
        <input placeholder="Playlist URL" className="input" value={form.youtube_playlist_url} onChange={(e) => setForm({ ...form, youtube_playlist_url: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
      </label>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button type="submit" disabled={saving} className="btn-gold">{saving ? "Saving…" : "Publish"}</button>
    </form>
  );
}
