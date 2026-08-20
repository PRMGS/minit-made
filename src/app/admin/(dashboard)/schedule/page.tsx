import { requireAdmin } from "@/lib/auth";

export default async function AdminSchedulePage() {
  const { supabase } = await requireAdmin();
  const { data: batches } = await supabase
    .from("shoot_batches")
    .select("*, shoot_batch_crew(*, crew_members(name)), bookings(id, format, assigned_slot_time, artists(artist_name))")
    .order("shoot_date", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Schedule</h1>
      <div className="space-y-4">
        {(batches ?? []).map((b) => (
          <div key={b.id} className="card p-5">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-gold">{b.format.replace(/_/g, " ")}</p>
                <p className="text-sm text-neutral-400">{b.shoot_date} · {b.location}</p>
              </div>
              <span className={`text-xs uppercase px-2 py-1 rounded-full border ${
                b.status === "open" ? "border-green-500 text-green-400" :
                b.status === "completed" ? "border-neutral-600 text-neutral-500" :
                "border-gold text-gold"
              }`}>
                {b.status}
              </span>
            </div>
            <div className="mt-3 text-sm">
              <p className="text-neutral-500 mb-1">Crew: {b.shoot_batch_crew?.map((c) => c.crew_members?.name).join(", ") || "None assigned"}</p>
              <p className="text-neutral-500">Artists booked: {b.bookings?.length ?? 0}/{b.max_artists}</p>
            </div>
          </div>
        ))}
        {!batches?.length && <p className="text-neutral-500 text-sm">No batches scheduled.</p>}
      </div>
    </div>
  );
}
