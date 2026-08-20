import { requireAdmin } from "@/lib/auth";
import { formatMoney } from "@/lib/constants";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const { supabase } = await requireAdmin();

  const [batches, artists, bookings, submissions] = await Promise.all([
    supabase.from("shoot_batches").select("*").gte("shoot_date", new Date().toISOString().slice(0, 10)).order("shoot_date").limit(10),
    supabase.from("artists").select("id", { count: "exact", head: true }),
    supabase.from("bookings").select("total_price, status, payment_status"),
    supabase.from("music_submissions").select("submission_status"),
  ]);

  const totalRevenue = (bookings.data ?? [])
    .filter((b) => b.payment_status === "completed")
    .reduce((sum, b) => sum + b.total_price, 0);

  const pendingSubs = (submissions.data ?? []).filter((s) => s.submission_status === "submitted" || s.submission_status === "pending").length;
  const approvedSubs = (submissions.data ?? []).filter((s) => s.submission_status === "approved").length;
  const revisionSubs = (submissions.data ?? []).filter((s) => s.submission_status === "needs_revision").length;

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-bold">Master Dashboard</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Artists" value={String(artists.count ?? 0)} />
        <StatCard label="Total Revenue" value={formatMoney(totalRevenue)} />
        <StatCard label="Bookings" value={String(bookings.data?.length ?? 0)} />
        <StatCard label="Pending Submissions" value={String(pendingSubs)} />
      </div>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Upcoming Batches (next 3 weeks)</h2>
          <Link href="/admin/batches" className="text-gold text-sm">Manage batches →</Link>
        </div>
        <div className="card divide-y divide-border">
          {(batches.data ?? []).length === 0 && <p className="p-4 text-neutral-500 text-sm">No upcoming batches.</p>}
          {(batches.data ?? []).map((b) => (
            <div key={b.id} className="p-4 flex justify-between items-center text-sm">
              <span>{b.format.replace(/_/g, " ")}</span>
              <span className="text-neutral-400">{b.shoot_date} · {b.location}</span>
              <span className="text-neutral-500">{b.current_artists}/{b.max_artists} · {b.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">Music Submissions Overview</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <StatCard label="Pending Review" value={String(pendingSubs)} />
          <StatCard label="Approved" value={String(approvedSubs)} />
          <StatCard label="Needs Revision" value={String(revisionSubs)} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/batches" className="btn-gold text-sm">Create Batch</Link>
        <Link href="/admin/pricing" className="border border-border rounded-lg px-4 py-2 text-sm hover:border-gold">Edit Pricing</Link>
        <Link href="/admin/content-queue" className="border border-border rounded-lg px-4 py-2 text-sm hover:border-gold">Content Queue</Link>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-gold mt-1">{value}</p>
    </div>
  );
}
