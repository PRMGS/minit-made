import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageBlocksRenderer from "@/components/PageBlocksRenderer";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: page } = await supabase.from("pages").select("*").eq("slug", "home").eq("status", "published").maybeSingle();

  return (
    <main className="flex-1">
      <SiteHeader />
      <PageBlocksRenderer content={page?.content} />
      <SiteFooter />
    </main>
  );
}
