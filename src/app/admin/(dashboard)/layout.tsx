import Link from "next/link";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/batches", label: "Batches" },
  { href: "/admin/artists", label: "Artists" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/submissions", label: "Music" },
  { href: "/admin/content-queue", label: "Content" },
  { href: "/admin/crew", label: "Crew" },
  { href: "/admin/schedule", label: "Schedule" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/builder/pages", label: "Page Builder" },
  { href: "/admin/builder/branding", label: "Branding" },
  { href: "/admin/builder/navigation", label: "Navigation" },
  { href: "/admin/builder/assets", label: "Assets" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex min-h-screen">
      <aside className="w-56 border-r border-border p-6 shrink-0">
        <Link href="/admin/dashboard" className="font-extrabold tracking-tight block mb-8">
          MINIT <span className="text-gold">MADE</span>
        </Link>
        <nav className="space-y-1 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block px-3 py-2 rounded-lg text-neutral-300 hover:bg-surface hover:text-gold">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-black">{children}</main>
    </div>
  );
}
