"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addOnLabel, formatShootDate, productionStatusLabel } from "@/lib/constants";
import type { Database } from "@/types/database.types";

type Task = Database["public"]["Tables"]["add_on_orders"]["Row"] & {
  bookings: { artists: { artist_name: string } | null } | null;
};

const STATUSES = ["pending", "in_production", "ready", "delivered"];

export default function TasksClient({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(id: string, production_status: string) {
    setError(null);
    try {
      const res = await fetch(`/api/crew/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ production_status }),
      });
      if (!res.ok) throw new Error("update failed");
      router.refresh();
    } catch {
      setError("Couldn't update that task. Check your connection and try again.");
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-300 text-sm">
          {error}
        </div>
      )}
      {tasks.map((t) => (
        <div key={t.id} className="card p-4 text-sm space-y-2">
          <p className="font-semibold">{addOnLabel(t.add_on_type)}</p>
          <p className="text-neutral-500">{t.bookings?.artists?.artist_name}</p>
          {t.due_date && <p className="text-neutral-500">Due: {formatShootDate(t.due_date)}</p>}
          {t.notes && <p className="text-neutral-400">{t.notes}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(t.id, s)}
                className={`px-3 py-1.5 rounded-lg text-xs border whitespace-nowrap ${t.production_status === s ? "border-gold text-gold" : "border-border text-neutral-400"}`}
              >
                {productionStatusLabel(s)}
              </button>
            ))}
          </div>
        </div>
      ))}
      {!tasks.length && <p className="text-neutral-500 text-sm">No tasks assigned.</p>}
    </div>
  );
}
