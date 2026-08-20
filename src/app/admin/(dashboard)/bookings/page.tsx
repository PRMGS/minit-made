import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/constants";
import Link from "next/link";

export default async function AdminBookingsPage() {
  const { supabase } = await requireAdmin();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, artists(artist_name, email), shoot_batches(shoot_date, location)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Bookings</h1>
      <div className="card divide-y divide-border">
        {(bookings ?? []).map((b) => (
          <Link key={b.id} href={`/admin/bookings/${b.id}`} className="p-4 flex flex-wrap justify-between items-center text-sm block hover:bg-white/5">
            <div>
              <p className="font-semibold">{b.artists?.artist_name}</p>
              <p className="text-neutral-500">{b.format.replace(/_/g, " ")} · {b.shoot_batches?.shoot_date ?? "Unscheduled"}</p>
            </div>
            <p className="text-neutral-400">{b.status} / {b.payment_status}</p>
            <p className="text-gold font-semibold">{formatMoney(b.total_price)}</p>
          </Link>
        ))}
        {!bookings?.length && <p className="p-4 text-neutral-500 text-sm">No bookings yet.</p>}
      </div>
    </div>
  );
}
