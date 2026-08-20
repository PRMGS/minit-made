import { requireAdmin } from "@/lib/auth";
import { AddOnQueue, UploadContentForm } from "./ContentQueueClient";

export default async function AdminContentQueuePage() {
  const { supabase } = await requireAdmin();

  const [orders, crew] = await Promise.all([
    supabase
      .from("add_on_orders")
      .select("*, bookings(artist_id, format, artists(artist_name))")
      .order("created_at", { ascending: false }),
    supabase.from("crew_members").select("*"),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-6">Content Production Queue</h1>
        <AddOnQueue orders={orders.data ?? []} crew={crew.data ?? []} />
      </div>
      <UploadContentForm />
    </div>
  );
}
