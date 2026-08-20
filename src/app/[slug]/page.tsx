import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageBlocksRenderer from "@/components/PageBlocksRenderer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase.from("pages").select("title, meta_description").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!page) return {};
  return { title: page.title, description: page.meta_description ?? undefined };
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase.from("pages").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
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
