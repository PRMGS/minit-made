import { requireAdmin } from "@/lib/auth";
import BrandingClient from "./BrandingClient";

export default async function AdminBrandingPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "branding").single();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Branding</h1>
      <BrandingClient initial={data?.value as never} />
    </div>
  );
}
