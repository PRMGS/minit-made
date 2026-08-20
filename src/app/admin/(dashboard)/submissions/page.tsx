import { requireAdmin } from "@/lib/auth";
import SubmissionsClient from "./SubmissionsClient";

export default async function AdminSubmissionsPage() {
  const { supabase } = await requireAdmin();
  const { data: submissions } = await supabase
    .from("music_submissions")
    .select("*, bookings(artists(artist_name))")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Music Submissions</h1>
      <SubmissionsClient submissions={submissions ?? []} />
    </div>
  );
}
