import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageBlocksRenderer from "@/components/PageBlocksRenderer";

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
