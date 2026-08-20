import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageBlocksRenderer from "@/components/PageBlocksRenderer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "The terms that apply to booking and performing with Minit Made.",
  openGraph: { title: "Terms — Minit Made", description: "The terms that apply to booking and performing with Minit Made." },
};

export default async function TermsPage() {
  const supabase = await createClient();
  const { data: page } = await supabase.from("pages").select("*").eq("slug", "terms").eq("status", "published").maybeSingle();
  if (!page) notFound();

  return (
    <main className="flex-1">
      <SiteHeader />
      <div className="py-16">
        <PageBlocksRenderer content={page.content} />
      </div>
      <SiteFooter />
    </main>
  );
}
