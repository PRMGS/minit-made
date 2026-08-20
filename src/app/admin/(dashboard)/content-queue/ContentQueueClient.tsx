"use client";

import { useState } from "react";
import { ADD_ON_TYPES, contentTypeLabel } from "@/lib/constants";
import { ActionError, useAdminAction } from "@/lib/useAdminAction";
import type { Database } from "@/types/database.types";

type AddOnOrder = Database["public"]["Tables"]["add_on_orders"]["Row"] & {
  bookings: { artist_id: string; format: string; artists: { artist_name: string } | null } | null;
};
type Crew = Database["public"]["Tables"]["crew_members"]["Row"];
type ArtistOption = { id: string; artist_name: string; email: string };

const STATUSES = ["pending", "in_production", "ready", "delivered"] as const;
const CONTENT_TYPES = [
  "performance",
  "freestyle",
  "cypher",
  "city_spotlight",
  "bts",
  "broll",
  "interview",
] as const;

export function AddOnQueue({ orders, crew }: { orders: AddOnOrder[]; crew: Crew[] }) {
  const { run, json, error } = useAdminAction();

  const update = (id: string, patch: Record<string, unknown>) =>
    run(`/api/admin/addons/${id}`, json(patch));

  return (
    <div className="space-y-3">
      <ActionError message={error} />
      {orders.map((o) => (
        <div key={o.id} className="card p-4 flex flex-wrap gap-3 justify-between items-center text-sm">
          <div>
            <p className="font-semibold">
              {ADD_ON_TYPES.find((d) => d.id === o.add_on_type)?.label ?? o.add_on_type}
            </p>
            <p className="text-neutral-500">{o.bookings?.artists?.artist_name}</p>
          </div>

          <label className="sr-only" htmlFor={`status-${o.id}`}>
            Production status
          </label>
          <select
            id={`status-${o.id}`}
            value={o.production_status}
            onChange={(e) => update(o.id, { production_status: e.target.value })}
            className="input w-auto"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor={`crew-${o.id}`}>
            Assigned crew
          </label>
          <select
            id={`crew-${o.id}`}
            value={o.assigned_crew_id ?? ""}
            onChange={(e) => update(o.id, { assigned_crew_id: e.target.value || null })}
            className="input w-auto"
          >
            <option value="">Unassigned</option>
            {crew.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor={`due-${o.id}`}>
            Due date
          </label>
          <input
            id={`due-${o.id}`}
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

const EMPTY = {
  artist_id: "",
  booking_id: "",
  title: "",
  content_type: "performance",
  youtube_url: "",
  youtube_playlist_url: "",
  featured: false,
  status: "live",
};

export function UploadContentForm({ artists }: { artists: ArtistOption[] }) {
  const { run, json, busy, error } = useAdminAction();
  const [form, setForm] = useState(EMPTY);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const ok = await run("/api/admin/content", json(form, "POST"));
    if (ok) {
      setForm({ ...form, title: "", youtube_url: "", booking_id: "" });
      setNotice(
        form.status === "live"
          ? "Published. The artist has been emailed."
          : "Saved as pending — the artist isn't notified until it goes live."
      );
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-3">
      <h2 className="font-bold text-gold mb-2">Publish Content</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="content-artist" className="block text-xs text-neutral-500 mb-1">
            Artist
          </label>
          <select
            id="content-artist"
            required
            className="input"
            value={form.artist_id}
            onChange={(e) => setForm({ ...form, artist_id: e.target.value })}
          >
            <option value="">Choose an artist…</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>
                {a.artist_name} — {a.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content-title" className="block text-xs text-neutral-500 mb-1">
            Title
          </label>
          <input
            id="content-title"
            required
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="content-type" className="block text-xs text-neutral-500 mb-1">
            Type
          </label>
          <select
            id="content-type"
            className="input"
            value={form.content_type}
            onChange={(e) => setForm({ ...form, content_type: e.target.value })}
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {contentTypeLabel(t)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="content-status" className="block text-xs text-neutral-500 mb-1">
            Status
          </label>
          <select
            id="content-status"
            className="input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="live">Live — notify the artist</option>
            <option value="pending">Pending — don&apos;t notify yet</option>
          </select>
        </div>

        <div>
          <label htmlFor="content-youtube" className="block text-xs text-neutral-500 mb-1">
            YouTube URL
          </label>
          <input
            id="content-youtube"
            className="input"
            value={form.youtube_url}
            onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="content-playlist" className="block text-xs text-neutral-500 mb-1">
            Playlist URL
          </label>
          <input
            id="content-playlist"
            className="input"
            value={form.youtube_playlist_url}
            onChange={(e) => setForm({ ...form, youtube_playlist_url: e.target.value })}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
        />{" "}
        Featured
      </label>

      <ActionError message={error} />
      {notice && <p className="text-sm text-green-400">{notice}</p>}

      <button type="submit" disabled={busy} className="btn-gold">
        {busy ? "Saving…" : "Publish"}
      </button>
    </form>
  );
}
