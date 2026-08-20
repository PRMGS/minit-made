import { requireAdmin } from "@/lib/auth";
import { AddOnQueue, UploadContentForm } from "./ContentQueueClient";

export default async function AdminContentQueuePage() {
  const { supabase } = await requireAdmin();

  const [orders, crew, artists] = await Promise.all([
    supabase
      .from("add_on_orders")
      .select("*, bookings(artist_id, format, artists(artist_name))")
      .order("created_at", { ascending: false }),
    supabase.from("crew_members").select("*"),
    // Feeds the publish form's artist picker so nobody has to paste a UUID.
    supabase.from("artists").select("id, artist_name, email").order("artist_name"),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-6">Content Production Queue</h1>
        <AddOnQueue orders={orders.data ?? []} crew={crew.data ?? []} />
      </div>
      <UploadContentForm artists={artists.data ?? []} />
    </div>
  );
}
