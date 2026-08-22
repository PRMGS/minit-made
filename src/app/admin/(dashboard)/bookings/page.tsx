import { requireAdmin } from "@/lib/auth";
import { bookingStatusLabel, formatLabel, formatMoney, formatShootDate } from "@/lib/constants";
import Link from "next/link";

const PAGE_SIZE = 50;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "needs_scheduling", label: "Needs scheduling" },
  { key: "paid", label: "Paid" },
  { key: "unpaid", label: "Unpaid" },
] as const;

type Filter = (typeof FILTERS)[number]["key"];

/**
 * Bookings previously capped at 50 rows with no pagination, search or filter —
 * and truncated invisibly, since the page rendered normally with the oldest
 * bookings simply absent.
 */
export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; q?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const filter = (FILTERS.find((f) => f.key === params.filter)?.key ?? "all") as Filter;
  const q = (params.q ?? "").trim();

  let query = supabase
    .from("bookings")
    .select("*, artists(artist_name, email), shoot_batches(shoot_date, location)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filter === "needs_scheduling") {
    query = query.eq("payment_status", "completed").eq("needs_scheduling", true);
  } else if (filter === "paid") {
    query = query.eq("payment_status", "completed");
  } else if (filter === "unpaid") {
    query = query.neq("payment_status", "completed");
  }

  const { data: bookings, count } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  // Artist name lives on a joined row, so filter here rather than in PostgREST.
  const rows = q
    ? (bookings ?? []).filter((b) => {
        const hay = `${b.artists?.artist_name ?? ""} ${b.artists?.email ?? ""}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
    : (bookings ?? []);

  const total = count ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) =>
    `/admin/bookings?page=${p}&filter=${filter}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-sm text-neutral-500 tabular-nums">
          {total} total · page {page} of {lastPage}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/bookings?filter=${f.key}`}
            className={`px-3.5 py-1.5 rounded-lg text-xs border ${
              filter === f.key ? "border-gold text-gold" : "border-border text-neutral-400 hover:border-neutral-600"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <form className="mb-5 flex gap-2" action="/admin/bookings">
        <input type="hidden" name="filter" value={filter} />
        <label htmlFor="booking-search" className="sr-only">Search by artist name or email</label>
        <input
          id="booking-search"
          name="q"
          defaultValue={q}
          placeholder="Search artist name or email…"
          className="input"
        />
        <button type="submit" className="btn-gold text-sm whitespace-nowrap">Search</button>
      </form>

      <div className="card divide-y divide-border">
        {rows.map((b) => (
          <Link
            key={b.id}
            href={`/admin/bookings/${b.id}`}
            className="p-5 flex flex-wrap justify-between items-center gap-3 text-sm hover:bg-white/5"
          >
            <div>
              <p className="font-semibold">{b.artists?.artist_name}</p>
              <p className="text-neutral-500">
                {formatLabel(b.format)} ·{" "}
                {b.shoot_batches?.shoot_date
                  ? formatShootDate(b.shoot_batches.shoot_date)
                  : "Unscheduled"}
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className={`pill ${b.payment_status === "completed" ? "pill-paid" : "pill-unpaid"}`}>
                {b.payment_status === "completed" ? "Paid" : "Unpaid"}
              </span>
              <span className={`pill ${b.status === "cancelled" ? "pill-cancelled" : "pill-neutral"}`}>
                {bookingStatusLabel(b.status)}
              </span>
              {b.needs_scheduling && b.payment_status === "completed" && (
                <span className="pill pill-unpaid">Needs slot</span>
              )}
            </div>
            <p className="text-gold font-semibold tabular-nums">{formatMoney(b.total_price)}</p>
          </Link>
        ))}
        {rows.length === 0 && (
          <p className="p-4 text-neutral-500 text-sm">
            {q ? `Nothing matching “${q}” on this page.` : "No bookings here yet."}
          </p>
        )}
      </div>

      {lastPage > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          {page > 1 ? (
            <Link href={href(page - 1)} className="text-gold">← Newer</Link>
          ) : (
            <span className="text-neutral-700">← Newer</span>
          )}
          {page < lastPage ? (
            <Link href={href(page + 1)} className="text-gold">Older →</Link>
          ) : (
            <span className="text-neutral-700">Older →</span>
          )}
        </div>
      )}
    </div>
  );
}
