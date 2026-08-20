import { requireAdmin } from "@/lib/auth";
import BatchesClient from "./BatchesClient";

export default async function AdminBatchesPage() {
  const { supabase } = await requireAdmin();
  const { data: batches } = await supabase
    .from("shoot_batches")
    .select("*")
    .order("shoot_date", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Shoot Batches</h1>
      <BatchesClient batches={batches ?? []} />
    </div>
  );
}
