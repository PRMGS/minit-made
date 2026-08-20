import { getCurrentArtist } from "@/lib/auth";
import { bookingStatusLabel, contentTypeLabel, formatLabel, formatShootDate } from "@/lib/constants";
import Link from "next/link";

export default async function ArtistDashboardPage() {
  const { supabase, artist } = await getCurrentArtist();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, shoot_batches(*)")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false });

  const { data: content } = await supabase
    .from("content_items")
    .select("*")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const upcoming = (bookings ?? []).filter((b) => ["confirmed", "scheduled"].includes(b.status));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {artist.artist_name}</h1>
        <p className="text-neutral-400">Here&apos;s what&apos;s coming up for you.</p>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-4">Upcoming Shoots</h2>
        {upcoming.length === 0 ? (
          <p className="text-neutral-500 text-sm">Nothing on the calendar yet. Apply and we&apos;ll get you booked.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {upcoming.map((b) => (
              <Link key={b.id} href={`/artist/bookings/${b.id}`} className="card p-5 block hover:border-gold">
                <p className="font-bold text-gold">{formatLabel(b.format)}</p>
                <p className="text-sm text-neutral-400">{formatShootDate(b.shoot_batches?.shoot_date)}</p>
                <p className="text-sm text-neutral-400">{b.shoot_batches?.location ?? ""}</p>
                <p className="text-xs mt-2 uppercase tracking-wide text-neutral-500">{bookingStatusLabel(b.status)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">Recent Content</h2>
        {!content?.length ? (
          <p className="text-neutral-500 text-sm">Your content shows up here once your performance is live.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {content.map((c) => (
              <div key={c.id} className="card p-4">
                <p className="font-semibold text-sm">{c.title}</p>
                <p className="text-xs text-neutral-500 mt-1">{contentTypeLabel(c.content_type)}</p>
                {c.youtube_url && (
                  <a href={c.youtube_url} target="_blank" className="text-xs text-gold mt-2 block">
                    Watch on YouTube →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/apply" className="btn-gold text-sm">Apply for Another Moment</Link>
          <Link href="/artist/bookings" className="border border-border rounded-lg px-4 py-2 text-sm hover:border-gold">
            View All
          </Link>
        </div>
      </section>
    </div>
  );
}
