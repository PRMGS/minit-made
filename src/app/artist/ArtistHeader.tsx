"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/artist/dashboard", label: "Dashboard" },
  { href: "/artist/bookings", label: "Bookings" },
  { href: "/artist/content", label: "Content" },
  { href: "/artist/profile", label: "Profile" },
  { href: "/artist/settings", label: "Settings" },
];

// Mirrors middleware's own list of unprotected /artist paths. On these, the
// visitor may not be signed in at all, so linking (and Next prefetching) five
// pages they can't reach just bounced every load straight back to login.
const PUBLIC_PREFIXES = ["/artist/login", "/artist/signup", "/artist/access", "/artist/forgot-password"];

export default function ArtistHeader() {
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <header className="border-b border-border">
      <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link href={isPublic ? "/" : "/artist/dashboard"} className="font-extrabold tracking-tight whitespace-nowrap">
          MINIT <span className="text-gold">MADE</span>
        </Link>
        {!isPublic && (
          // Wraps on mobile instead of overflowing the viewport
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-300">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-gold whitespace-nowrap">
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
