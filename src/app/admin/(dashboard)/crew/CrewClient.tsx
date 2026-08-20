"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database.types";

type Crew = Database["public"]["Tables"]["crew_members"]["Row"];
type Batch = Database["public"]["Tables"]["shoot_batches"]["Row"];

export default function CrewClient({ crew, batches }: { crew: Crew[]; batches: Batch[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", roles: "" });
  const [assign, setAssign] = useState({ batch_id: "", crew_id: "", role: "" });
  const [error, setError] = useState<string | null>(null);

  async function addCrew(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/crew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, roles: form.roles.split(",").map((r) => r.trim()).filter(Boolean) }),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else {
      setForm({ name: "", email: "", phone: "", roles: "" });
      router.refresh();
    }
  }

  async function assignCrew(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/batch-crew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assign),
    });
    const data = await res.json();
    if (data.error) setError(data.error);
    else router.refresh();
  }

  return (
    <div className="space-y-8">
      <form onSubmit={addCrew} className="card p-5 grid sm:grid-cols-4 gap-3 items-end">
        <input required placeholder="Name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="email" placeholder="Email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Roles (comma sep)" className="input" value={form.roles} onChange={(e) => setForm({ ...form, roles: e.target.value })} />
        <button type="submit" className="btn-gold sm:col-span-4">Add Crew Member</button>
      </form>

      <form onSubmit={assignCrew} className="card p-5 grid sm:grid-cols-4 gap-3 items-end">
        <select required className="input" value={assign.crew_id} onChange={(e) => setAssign({ ...assign, crew_id: e.target.value })}>
          <option value="">Crew member…</option>
          {crew.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select required className="input" value={assign.batch_id} onChange={(e) => setAssign({ ...assign, batch_id: e.target.value })}>
          <option value="">Batch…</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.format} — {b.shoot_date}</option>)}
        </select>
        <input placeholder="Role on shoot" className="input" value={assign.role} onChange={(e) => setAssign({ ...assign, role: e.target.value })} />
        <button type="submit" className="btn-gold">Assign to Shoot</button>
      </form>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="card divide-y divide-border">
        {crew.map((c) => (
          <div key={c.id} className="p-4 text-sm flex justify-between">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-neutral-500">{c.email} · {c.roles.join(", ")}</p>
            </div>
          </div>
        ))}
        {!crew.length && <p className="p-4 text-neutral-500 text-sm">No crew yet.</p>}
      </div>
    </div>
  );
}
