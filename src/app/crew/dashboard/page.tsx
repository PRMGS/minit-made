import { getCurrentCrew } from "@/lib/auth";
import Link from "next/link";

export default async function CrewDashboardPage() {
  const { supabase, crew } = await getCurrentCrew();

  const today = new Date();
  const in7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: assignments } = await supabase
    .from("shoot_batch_crew")
    .select("*, shoot_batches(*)")
    .eq("crew_id", crew.id);

  const upcoming = (assignments ?? [])
    .filter((a) => {
      const d = a.shoot_batches?.shoot_date ? new Date(a.shoot_batches.shoot_date) : null;
      return d && d >= today && d <= in7;
    })
    .sort((a, b) => (a.shoot_batches?.shoot_date ?? "").localeCompare(b.shoot_batches?.shoot_date ?? ""));

  const { data: tasks } = await supabase
    .from("add_on_orders")
    .select("*")
    .eq("assigned_crew_id", crew.id)
    .neq("production_status", "delivered");

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Hey, {crew.name}</h1>

      <section>
        <h2 className="text-lg font-bold mb-3">Upcoming Shoots (7 days)</h2>
        <div className="space-y-3">
          {upcoming.map((a) => (
            <Link key={a.id} href={`/crew/shoots/${a.batch_id}`} className="card p-4 block">
              <p className="font-semibold">{a.shoot_batches?.format.replace(/_/g, " ")}</p>
              <p className="text-sm text-neutral-400">{a.shoot_batches?.shoot_date} · {a.shoot_batches?.location}</p>
            </Link>
          ))}
          {!upcoming.length && <p className="text-neutral-500 text-sm">No shoots in the next 7 days.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Assigned Tasks</h2>
        <p className="text-neutral-400 text-sm">{tasks?.length ?? 0} open task(s)</p>
        <Link href="/crew/tasks" className="btn-gold inline-block mt-3">View Tasks</Link>
      </section>
    </div>
  );
}
