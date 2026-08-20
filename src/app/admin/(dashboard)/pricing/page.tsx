import { requireAdmin } from "@/lib/auth";
import PricingClient from "./PricingClient";

export default async function AdminPricingPage() {
  const { supabase } = await requireAdmin();
  const { data: configs } = await supabase
    .from("pricing_config")
    .select("*")
    .order("format");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Pricing</h1>
      <p className="text-neutral-500 text-sm mb-6">
        Changes take effect immediately for new bookings. Existing bookings keep their original snapshot.
      </p>
      <PricingClient configs={configs ?? []} />
    </div>
  );
}
