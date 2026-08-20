import { requireAdmin } from "@/lib/auth";
import AssetsClient from "./AssetsClient";

export default async function AdminAssetsPage() {
  const { supabase } = await requireAdmin();
  const { data: files } = await supabase.storage.from("page-assets").list("pending", {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" },
  });

  const assets = (files ?? [])
    .filter((f) => f.name)
    .map((f) => ({
      name: f.name,
      url: supabase.storage.from("page-assets").getPublicUrl(`pending/${f.name}`).data.publicUrl,
    }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Asset Library</h1>
      <AssetsClient assets={assets} />
    </div>
  );
}
