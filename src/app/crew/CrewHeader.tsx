"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Mirrors middleware's own list of unprotected /crew paths — same reasoning
// as ArtistHeader: don't link (and Next-prefetch) protected pages from a
// screen a signed-out visitor is on.
const PUBLIC_PREFIXES = ["/crew/login", "/crew/signup"];

export default function CrewHeader() {
  const pathname = usePathname();
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <header className="border-b border-border sticky top-0 bg-black z-10">
      <nav className="px-4 py-4 flex items-center justify-between gap-3">
        <Link href={isPublic ? "/" : "/crew/dashboard"} className="font-extrabold text-lg tracking-tight whitespace-nowrap">
          MINIT <span className="text-gold">MADE</span>
        </Link>
        {!isPublic && (
          <div className="flex gap-4 sm:gap-5 text-sm shrink-0">
            <Link href="/crew/shoots" className="hover:text-gold">Shoots</Link>
            <Link href="/crew/tasks" className="hover:text-gold">Tasks</Link>
            <Link href="/crew/profile" className="hover:text-gold">Profile</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
