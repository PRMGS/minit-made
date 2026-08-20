"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type Crew = Database["public"]["Tables"]["crew_members"]["Row"];

export default function CrewProfilePage() {
  const [crew, setCrew] = useState<Crew | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", roles: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: c } = await supabase.from("crew_members").select("*").eq("auth_user_id", data.user.id).single();
      if (c) {
        setCrew(c);
        setForm({ name: c.name, phone: c.phone ?? "", roles: c.roles.join(", ") });
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!crew) return;
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("crew_members")
      .update({ name: form.name, phone: form.phone, roles: form.roles.split(",").map((r) => r.trim()).filter(Boolean) })
      .eq("id", crew.id);
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/crew/login";
  }

  if (!crew) return <p className="text-neutral-500 text-sm">Loading…</p>;

  return (
    <div className="space-y-8 max-w-sm">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <form onSubmit={handleSave} className="space-y-3">
        <label className="block text-sm text-neutral-400">Name</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <label className="block text-sm text-neutral-400">Phone</label>
        <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <label className="block text-sm text-neutral-400">Roles / Skills (comma separated)</label>
        <input className="input" value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} />
        <button type="submit" disabled={saving} className="btn-gold">{saving ? "Saving…" : "Save"}</button>
      </form>
      <button onClick={handleLogout} className="border border-border rounded-lg px-4 py-2 text-sm">Log Out</button>
    </div>
  );
}
