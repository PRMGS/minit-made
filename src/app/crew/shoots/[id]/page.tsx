import { getCurrentCrew } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function CrewShootDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, crew } = await getCurrentCrew();

  const { data: assignment } = await supabase
    .from("shoot_batch_crew")
    .select("*, shoot_batches(*)")
    .eq("batch_id", id)
    .eq("crew_id", crew.id)
    .maybeSingle();

  if (!assignment) notFound();

  const batch = assignment.shoot_batches;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, artists(*), music_submissions(*), production_prep(*)")
    .eq("batch_id", id)
    .eq("status", "confirmed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{batch?.format.replace(/_/g, " ")}</h1>
        <p className="text-neutral-400 text-sm mt-1">{batch?.shoot_date} · {batch?.location}</p>
        <p className="text-xs text-neutral-500 mt-1">Your role: {assignment.role ?? "Crew"}</p>
      </div>

      <section>
        <h2 className="font-bold text-gold mb-3">Artist Roster</h2>
        <div className="space-y-3">
          {(bookings ?? []).map((b) => (
            <div key={b.id} className="card p-4 text-sm">
              <p className="font-semibold">{b.artists?.artist_name}</p>
              <p className="text-neutral-400">Song: {b.music_submissions?.[0]?.song_title}</p>
              <p className="text-neutral-400">Vibe: {b.production_prep?.[0]?.performance_vibe}</p>
              <p className="text-neutral-400">Height: {b.production_prep?.[0]?.height}</p>
              <p className="text-neutral-400">Slot: {b.assigned_slot_time ?? "TBD"}</p>
              {b.production_prep?.[0]?.special_requests && (
                <p className="text-neutral-500 mt-1">Notes: {b.production_prep[0].special_requests}</p>
              )}
            </div>
          ))}
          {!bookings?.length && <p className="text-neutral-500 text-sm">No confirmed artists yet.</p>}
        </div>
      </section>
    </div>
  );
}
