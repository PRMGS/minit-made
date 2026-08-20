import { requireAdmin } from "@/lib/auth";
import Link from "next/link";

export default async function AdminArtistsPage() {
  const { supabase } = await requireAdmin();
  const { data: artists } = await supabase
    .from("artists")
    .select("*, bookings(id, status, payment_status)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Artists</h1>
      <div className="card divide-y divide-border">
        {(artists ?? []).map((a) => (
          <div key={a.id} className="p-4 flex justify-between items-center text-sm">
            <div>
              <p className="font-semibold">{a.artist_name}</p>
              <p className="text-neutral-500">{a.email} · {a.city}</p>
            </div>
            <p className="text-neutral-400">{a.bookings?.length ?? 0} booking(s)</p>
            <Link href={`/admin/artists/${a.id}`} className="text-gold hover:underline">View</Link>
          </div>
        ))}
        {!artists?.length && <p className="p-4 text-neutral-500 text-sm">No artists yet.</p>}
      </div>
    </div>
  );
}
