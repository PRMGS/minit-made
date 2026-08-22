import Link from "next/link";

import type { Metadata } from "next";

/** Personal data behind a login — never index it. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Grouped by how admins actually use the dashboard, not alphabetically: what
 * needs checking daily, the roster it's checking on, one-time site setup, then
 * settings. A flat 14-item list made every item look equally urgent.
 */
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard" }],
  },
  {
    label: "Bookings & Ops",
    items: [
      { href: "/admin/bookings", label: "Bookings" },
      { href: "/admin/batches", label: "Batches" },
      { href: "/admin/schedule", label: "Schedule" },
      { href: "/admin/crew", label: "Crew" },
    ],
  },
  {
    label: "Roster & Content",
    items: [
      { href: "/admin/artists", label: "Artists" },
      { href: "/admin/submissions", label: "Music" },
      { href: "/admin/content-queue", label: "Content" },
    ],
  },
  {
    label: "Site Builder",
    items: [
      { href: "/admin/builder/pages", label: "Page Builder" },
      { href: "/admin/builder/branding", label: "Branding" },
      { href: "/admin/builder/navigation", label: "Navigation" },
      { href: "/admin/builder/assets", label: "Assets" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/pricing", label: "Pricing" },
      { href: "/admin/settings/calendar", label: "Calendar Sync" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex h-screen overflow-hidden">
      <aside className="w-64 border-r border-border p-7 shrink-0 overflow-y-auto flex flex-col">
        <Link href="/admin/dashboard" className="font-extrabold tracking-tight block mb-10">
          MINIT <span className="text-gold">MADE</span>
        </Link>
        <nav className="text-sm flex-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-7 last:mb-0">
              <p className="px-3 mb-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-neutral-600">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((n) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="block px-3 py-2.5 rounded-lg text-neutral-300 hover:bg-surface hover:text-gold"
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 pt-5 border-t border-border block px-3 py-2.5 rounded-lg text-neutral-400 text-xs hover:bg-surface hover:text-gold"
        >
          View Live Site ↗
        </a>
      </aside>
      <main className="flex-1 p-10 bg-black overflow-y-auto">{children}</main>
    </div>
  );
}
