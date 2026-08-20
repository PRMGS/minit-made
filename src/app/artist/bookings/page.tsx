import { getCurrentArtist } from "@/lib/auth";
import { bookingStatusLabel, formatLabel, formatMoney, formatShootDate } from "@/lib/constants";
import Link from "next/link";

export default async function ArtistBookingsPage() {
  const { supabase, artist } = await getCurrentArtist();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, shoot_batches(*)")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      <div className="space-y-3">
        {(bookings ?? []).map((b) => (
          <Link key={b.id} href={`/artist/bookings/${b.id}`} className="card p-5 flex justify-between items-center hover:border-gold block">
            <div>
              <p className="font-bold">{formatLabel(b.format)}</p>
              <p className="text-sm text-neutral-400">
                {formatShootDate(b.shoot_batches?.shoot_date)} · {b.shoot_batches?.location ?? "Location TBD"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm uppercase text-neutral-500 whitespace-nowrap">{bookingStatusLabel(b.status)}</p>
              <p className="text-gold font-semibold">{formatMoney(b.total_price)}</p>
            </div>
          </Link>
        ))}
        {!bookings?.length && <p className="text-neutral-500 text-sm">Nothing here yet — apply and your spot will show up on this page.</p>}
      </div>
    </div>
  );
}
