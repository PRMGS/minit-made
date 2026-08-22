import { requireAdmin } from "@/lib/auth";
import NavigationClient, { DEFAULT_NAV, type Nav } from "./NavigationClient";

export default async function AdminNavigationPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "navigation").maybeSingle();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Navigation</h1>
      <NavigationClient initial={(data?.value as Nav) ?? DEFAULT_NAV} />
    </div>
  );
}
