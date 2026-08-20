import { getCurrentArtist } from "@/lib/auth";
import { addOnLabel, bookingStatusLabel, formatLabel, formatMoney, formatShootDate, formatSlotTime, productionStatusLabel, submissionStatusLabel } from "@/lib/constants";
import { notFound } from "next/navigation";
import { SUPPORT_EMAIL } from "@/lib/errors";

export default async function ArtistBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, artist } = await getCurrentArtist();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, shoot_batches(*), music_submissions(*), production_prep(*), add_on_orders(*)")
    .eq("id", id)
    .eq("artist_id", artist.id)
    .single();

  if (!booking) notFound();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{formatLabel(booking.format)}</h1>
        <p className="text-sm uppercase tracking-wide text-neutral-500 mt-1">{bookingStatusLabel(booking.status)}</p>
      </div>

      <section className="card p-5 space-y-2 text-sm">
        <h2 className="font-bold text-gold mb-2">Shoot Details</h2>
        <p><span className="text-neutral-500">Date:</span> {formatShootDate(booking.shoot_batches?.shoot_date, "We'll be in touch")}</p>
        <p><span className="text-neutral-500">Location:</span> {booking.shoot_batches?.location ?? "To be assigned"}</p>
        <p><span className="text-neutral-500">Call time:</span> {formatSlotTime(booking.assigned_slot_time, "We'll send this before your shoot")}</p>
      </section>

      <section className="card p-5 space-y-2 text-sm">
        <h2 className="font-bold text-gold mb-2">Add-ons Purchased</h2>
        {booking.add_on_orders?.length ? (
          booking.add_on_orders.map((a) => (
            <div key={a.id} className="flex justify-between">
              <span>{addOnLabel(a.add_on_type)}</span>
              <span className="text-neutral-400">{productionStatusLabel(a.production_status)}</span>
            </div>
          ))
        ) : (
          <p className="text-neutral-500">None</p>
        )}
      </section>

      <section className="card p-5 space-y-2 text-sm">
        <h2 className="font-bold text-gold mb-2">Music Submission</h2>
        <p><span className="text-neutral-500">Song:</span> {booking.music_submissions?.[0]?.song_title}</p>
        <p><span className="text-neutral-500">Status:</span> {submissionStatusLabel(booking.music_submissions?.[0]?.submission_status ?? "pending")}</p>
      </section>

      <section className="card p-5 space-y-2 text-sm">
        <h2 className="font-bold text-gold mb-2">Preparation Instructions</h2>
        <p className="text-neutral-400">
          Arrive 30 minutes before your call time. Bring any wardrobe changes and be ready to perform your submitted track live.
        </p>
      </section>

      <div className="flex justify-between items-center">
        <p className="text-gold font-bold text-lg">{formatMoney(booking.total_price)}</p>
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Booking ${booking.id}`} className="border border-border rounded-lg px-4 py-2 text-sm hover:border-gold">
          Contact Minit Made
        </a>
      </div>
    </div>
  );
}
