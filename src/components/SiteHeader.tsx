import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type NavItem = { label: string; href: string };

export default async function SiteHeader() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "navigation").maybeSingle();
  const header = ((data?.value as { header?: NavItem[] } | null)?.header ?? []) as NavItem[];

  return (
    <header className="relative z-10 max-w-6xl mx-auto px-6 pt-6 pb-4">
      {/* Primary row: identity + the one action that matters */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="font-extrabold tracking-tight text-lg whitespace-nowrap">
          MINIT <span className="text-gold">MADE</span>
        </Link>

        <div className="flex items-center gap-5">
          {/* Secondary links sit inline on desktop, drop to their own row on mobile */}
          <nav className="hidden sm:flex items-center gap-5 text-sm text-neutral-300">
            {header.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-gold whitespace-nowrap">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/apply" className="btn-gold text-sm whitespace-nowrap">
            Apply Now
          </Link>
        </div>
      </div>

      {/* Mobile-only secondary row — keeps the header uncramped without a hamburger */}
      <nav className="flex sm:hidden items-center justify-center gap-5 text-sm text-neutral-400 mt-4">
        {header.map((item) => (
          <Link key={item.href} href={item.href} className="hover:text-gold whitespace-nowrap">
            {item.label}
          </Link>
        ))}
        <Link href="/artist/login" className="hover:text-gold whitespace-nowrap">
          Sign in
        </Link>
      </nav>

      {/* Desktop-only: de-emphasised returning-artist link */}
      <div className="hidden sm:flex justify-end mt-2">
        <Link href="/artist/login" className="text-xs text-neutral-500 hover:text-gold">
          Returning artist? Sign in
        </Link>
      </div>
    </header>
  );
}
