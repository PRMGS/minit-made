import Link from "next/link";

import type { Metadata } from "next";

/** Personal data behind a login — never index it. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

const NAV = [
  { href: "/artist/dashboard", label: "Dashboard" },
  { href: "/artist/bookings", label: "Bookings" },
  { href: "/artist/content", label: "Content" },
  { href: "/artist/profile", label: "Profile" },
  { href: "/artist/settings", label: "Settings" },
];

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Link href="/artist/dashboard" className="font-extrabold tracking-tight whitespace-nowrap">
            MINIT <span className="text-gold">MADE</span>
          </Link>
          {/* Wraps on mobile instead of overflowing the viewport */}
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-300">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-gold whitespace-nowrap">
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex-1">{children}</div>
    </div>
  );
}
