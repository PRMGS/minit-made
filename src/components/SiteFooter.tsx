import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type NavItem = { label: string; href: string };

export default async function SiteFooter() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "navigation").maybeSingle();
  const footer = ((data?.value as { footer?: NavItem[] } | null)?.footer ?? []) as NavItem[];

  return (
    <footer className="border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
        <span>© {new Date().getFullYear()} Minit Made. All rights reserved.</span>
        {/* py-2 rather than bare text: these were ~20px tall, well under a usable tap target. */}
        <div className="flex flex-wrap justify-center gap-x-6">
          {footer.map((item) => (
            <Link key={item.href} href={item.href} className="py-2 hover:text-gold">
              {item.label}
            </Link>
          ))}
          <Link href="/artist/login" className="py-2 hover:text-gold">Artist Login</Link>
        </div>
      </div>
    </footer>
  );
}
