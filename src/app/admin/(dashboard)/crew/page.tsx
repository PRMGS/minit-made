import { requireAdmin } from "@/lib/auth";
import CrewClient from "./CrewClient";

export default async function AdminCrewPage() {
  const { supabase } = await requireAdmin();
  const [crew, batches] = await Promise.all([
    supabase.from("crew_members").select("*").order("name"),
    supabase.from("shoot_batches").select("*").order("shoot_date", { ascending: false }).limit(20),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Crew</h1>
      <CrewClient crew={crew.data ?? []} batches={batches.data ?? []} />
    </div>
  );
}
