import { getCurrentCrew } from "@/lib/auth";
import TasksClient from "./TasksClient";

export default async function CrewTasksPage() {
  const { supabase, crew } = await getCurrentCrew();
  const { data: tasks } = await supabase
    .from("add_on_orders")
    .select("*, bookings(artists(artist_name))")
    .eq("assigned_crew_id", crew.id)
    .order("due_date", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Tasks</h1>
      <TasksClient tasks={tasks ?? []} />
    </div>
  );
}
