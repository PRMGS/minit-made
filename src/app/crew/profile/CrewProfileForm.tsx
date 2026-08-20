"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type Crew = Database["public"]["Tables"]["crew_members"]["Row"];

export default function CrewProfileForm({ crew }: { crew: Crew }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: crew.name,
    phone: crew.phone ?? "",
    roles: crew.roles.join(", "),
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    // The save result was previously discarded, so a failed update looked
    // identical to a successful one.
    const { error } = await createClient()
      .from("crew_members")
      .update({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        roles: form.roles.split(",").map((r) => r.trim()).filter(Boolean),
      })
      .eq("id", crew.id);

    setSaving(false);
    if (error) {
      console.error("[crew:profile] save failed", error);
      setStatus({ ok: false, message: "That didn't save. Check your connection and try again." });
      return;
    }
    setStatus({ ok: true, message: "Saved." });
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <label htmlFor="crew-name" className="block text-sm text-neutral-400 mb-1">Name</label>
        <input
          id="crew-name"
          required
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="crew-phone" className="block text-sm text-neutral-400 mb-1">Phone</label>
        <input
          id="crew-phone"
          type="tel"
          className="input"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="crew-roles" className="block text-sm text-neutral-400 mb-1">
          Roles / Skills (comma separated)
        </label>
        <input
          id="crew-roles"
          className="input"
          value={form.roles}
          onChange={(e) => setForm({ ...form, roles: e.target.value })}
        />
      </div>
      {status && (
        <p role="status" className={`text-sm ${status.ok ? "text-green-400" : "text-red-400"}`}>
          {status.message}
        </p>
      )}
      <button type="submit" disabled={saving} className="btn-gold">
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
