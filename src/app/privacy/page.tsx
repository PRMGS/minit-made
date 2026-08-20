import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageBlocksRenderer from "@/components/PageBlocksRenderer";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Minit Made collects, why, and what we do with it.",
  openGraph: { title: "Privacy — Minit Made", description: "What Minit Made collects, why, and what we do with it." },
};

export default async function PrivacyPage() {
  const supabase = await createClient();
  const { data: page } = await supabase.from("pages").select("*").eq("slug", "privacy").eq("status", "published").maybeSingle();
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
