import { getCurrentCrew } from "@/lib/auth";
import Link from "next/link";

export default async function CrewShootsPage() {
  const { supabase, crew } = await getCurrentCrew();
  const { data: assignments } = await supabase
    .from("shoot_batch_crew")
    .select("*, shoot_batches(*)")
    .eq("crew_id", crew.id);

  const sorted = (assignments ?? []).sort((a, b) =>
    (a.shoot_batches?.shoot_date ?? "").localeCompare(b.shoot_batches?.shoot_date ?? "")
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Shoots</h1>
      <div className="space-y-3">
        {sorted.map((a) => (
          <Link key={a.id} href={`/crew/shoots/${a.batch_id}`} className="card p-5 block">
            <p className="font-bold text-gold">{a.shoot_batches?.format.replace(/_/g, " ")}</p>
            <p className="text-sm text-neutral-400 mt-1">{a.shoot_batches?.shoot_date} · {a.shoot_batches?.location}</p>
            <p className="text-xs text-neutral-500 mt-1">Role: {a.role ?? "Crew"}</p>
          </Link>
        ))}
        {!sorted.length && <p className="text-neutral-500 text-sm">No shoots assigned yet.</p>}
      </div>
    </div>
  );
}
