import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { ADD_ON_TYPES, type AddOnType, type FormatId } from "@/lib/constants";

export type PricingConfig = Database["public"]["Tables"]["pricing_config"]["Row"];

export type PricingSnapshot = {
  pricing_config_id: string;
  format: FormatId;
  base_price: number;
  add_ons: { type: AddOnType; price: number }[];
  add_ons_total: number;
  total_price: number;
  /** Every add-on's price for this format, so the UI can show costs before selection. */
  catalog: { type: AddOnType; price: number }[];
};

/**
 * Fetches the active pricing config for a format/region and computes a full
 * price breakdown server-side. Never trust prices sent from the browser.
 */
export async function calculatePricing(
  supabase: ReturnType<typeof createAdminClient<Database>>,
  format: FormatId,
  addOnTypes: AddOnType[],
  region = "default"
): Promise<PricingSnapshot> {
  const { data: config, error } = await supabase
    .from("pricing_config")
    .select("*")
    .eq("format", format)
    .eq("region", region)
    .eq("active", true)
    .order("effective_date", { ascending: false })
    .limit(1)
    .single();

  if (error || !config) {
    throw new Error(`No active pricing config found for format=${format} region=${region}`);
  }

  const addOns = addOnTypes.map((type) => {
    const def = ADD_ON_TYPES.find((a) => a.id === type);
    if (!def) throw new Error(`Unknown add-on type: ${type}`);
    const price = (config as unknown as Record<string, number>)[def.priceField] ?? 0;
    return { type, price };
  });

  const add_ons_total = addOns.reduce((sum, a) => sum + a.price, 0);
  const base_price = config.video_production_price;

  const catalog = ADD_ON_TYPES.map((def) => ({
    type: def.id as AddOnType,
    price: (config as unknown as Record<string, number>)[def.priceField] ?? 0,
  }));

  return {
    pricing_config_id: config.id,
    format,
    base_price,
    add_ons: addOns,
    add_ons_total,
    total_price: base_price + add_ons_total,
    catalog,
  };
}
