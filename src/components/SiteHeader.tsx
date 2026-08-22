import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type NavItem = { label: string; href: string };

/**
 * Where a signed-in visitor's "Sign in" link should point instead. Checked in
 * this order since one person (the site owner, most often) can hold more than
 * one role now that admin accounts are also linked into artists/crew_members —
 * admin is the most privileged view, so it wins if more than one applies.
 */
async function signedInDestination(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const [{ data: admin }, { data: crew }, { data: artist }] = await Promise.all([
    supabase.from("admin_users").select("id").eq("auth_user_id", userId).maybeSingle(),
    supabase.from("crew_members").select("id").eq("auth_user_id", userId).maybeSingle(),
    supabase.from("artists").select("id").eq("auth_user_id", userId).maybeSingle(),
  ]);
  if (admin) return { label: "Admin Dashboard", href: "/admin/dashboard" };
  if (crew) return { label: "Crew Dashboard", href: "/crew/dashboard" };
  if (artist) return { label: "Your Dashboard", href: "/artist/dashboard" };
  return null;
}

export default async function SiteHeader() {
  const supabase = await createClient();
  const [{ data }, { data: userData }] = await Promise.all([
    supabase.from("site_settings").select("value").eq("key", "navigation").maybeSingle(),
    supabase.auth.getUser(),
  ]);
  const header = ((data?.value as { header?: NavItem[] } | null)?.header ?? []) as NavItem[];
  const signedIn = userData?.user ? await signedInDestination(supabase, userData.user.id) : null;
  const signInLink = signedIn ?? { label: "Sign in", href: "/artist/login" };

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
        <Link href={signInLink.href} className="hover:text-gold whitespace-nowrap">
          {signedIn ? `✓ ${signInLink.label}` : signInLink.label}
        </Link>
      </nav>

      {/* Desktop-only: de-emphasised returning-artist link, or a quiet
          confirmation once someone's actually signed in */}
      <div className="hidden sm:flex justify-end mt-2">
        <Link href={signInLink.href} className="text-xs text-neutral-500 hover:text-gold">
          {signedIn ? `Signed in — ${signInLink.label}` : `Returning artist? ${signInLink.label}`}
        </Link>
      </div>
    </header>
  );
}
