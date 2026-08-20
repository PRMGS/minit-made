import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/constants";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function AdminArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: artist } = await supabase.from("artists").select("*").eq("id", id).single();
  if (!artist) notFound();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, shoot_batches(*), music_submissions(*)")
    .eq("artist_id", id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{artist.artist_name}</h1>
        <p className="text-neutral-500 text-sm">{artist.name} · {artist.email} · {artist.phone}</p>
        <p className="text-neutral-500 text-sm">{artist.city} · IG: {artist.instagram} · TikTok: {artist.tiktok}</p>
      </div>

      <section>
        <h2 className="font-bold text-gold mb-3">Booking History</h2>
        <div className="space-y-3">
          {(bookings ?? []).map((b) => (
            <Link key={b.id} href={`/admin/bookings/${b.id}`} className="card p-4 flex justify-between items-center text-sm block hover:border-gold">
              <div>
                <p className="font-semibold">{b.format.replace(/_/g, " ")}</p>
                <p className="text-neutral-400">{b.shoot_batches?.shoot_date ?? "Unscheduled"}</p>
              </div>
              <p className="text-neutral-500">{b.status} / {b.payment_status}</p>
              <p className="text-gold font-semibold">{formatMoney(b.total_price)}</p>
            </Link>
          ))}
          {!bookings?.length && <p className="text-neutral-500 text-sm">No bookings.</p>}
        </div>
      </section>
    </div>
  );
}
