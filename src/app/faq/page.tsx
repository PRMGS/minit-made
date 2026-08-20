import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageBlocksRenderer from "@/components/PageBlocksRenderer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "How Minit Made works — formats, pricing, what to bring, and what you walk away with.",
  openGraph: { title: "FAQ — Minit Made", description: "How Minit Made works — formats, pricing, what to bring, and what you walk away with." },
};

export default async function FaqPage() {
  const supabase = await createClient();
  const { data: page } = await supabase.from("pages").select("*").eq("slug", "faq").eq("status", "published").maybeSingle();
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
