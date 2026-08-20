import { requireAdmin } from "@/lib/auth";
import { ADD_ON_TYPES, formatMoney } from "@/lib/constants";
import { notFound } from "next/navigation";
import BookingAdminClient from "./BookingAdminClient";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, artists(*), music_submissions(*), production_prep(*), add_on_orders(*)")
    .eq("id", id)
    .single();

  if (!booking) notFound();

  const { data: batches } = await supabase
    .from("shoot_batches")
    .select("*")
    .eq("format", booking.format)
    .order("shoot_date", { ascending: false });

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{booking.artists?.artist_name}</h1>
        <p className="text-neutral-500 text-sm">{booking.format.replace(/_/g, " ")} · {formatMoney(booking.total_price)}</p>
      </div>

      <BookingAdminClient booking={booking} batches={batches ?? []} />

      <section className="card p-5 space-y-2 text-sm">
        <h2 className="font-bold text-gold">Music Submission</h2>
        <p><span className="text-neutral-500">Song:</span> {booking.music_submissions?.[0]?.song_title}</p>
        <p><span className="text-neutral-500">Status:</span> {booking.music_submissions?.[0]?.submission_status}</p>
        {booking.music_submissions?.[0]?.audio_file_url && (
          <audio controls src={booking.music_submissions[0].audio_file_url} className="w-full mt-2" />
        )}
      </section>

      <section className="card p-5 space-y-2 text-sm">
        <h2 className="font-bold text-gold">Production Prep</h2>
        <p><span className="text-neutral-500">Vibe:</span> {booking.production_prep?.[0]?.performance_vibe}</p>
        <p><span className="text-neutral-500">Height:</span> {booking.production_prep?.[0]?.height}</p>
        <p><span className="text-neutral-500">Special Requests:</span> {booking.production_prep?.[0]?.special_requests}</p>
      </section>

      <section className="card p-5 space-y-2 text-sm">
        <h2 className="font-bold text-gold">Add-ons</h2>
        {booking.add_on_orders?.map((a) => (
          <div key={a.id} className="flex justify-between">
            <span>{ADD_ON_TYPES.find((d) => d.id === a.add_on_type)?.label ?? a.add_on_type}</span>
            <span className="text-neutral-400">{a.production_status}</span>
          </div>
        ))}
        {!booking.add_on_orders?.length && <p className="text-neutral-500">None</p>}
      </section>
    </div>
  );
}
