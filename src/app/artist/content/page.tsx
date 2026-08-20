import { getCurrentArtist } from "@/lib/auth";
import { contentTypeLabel } from "@/lib/constants";

export default async function ArtistContentPage() {
  const { supabase, artist } = await getCurrentArtist();
  const { data: content } = await supabase
    .from("content_items")
    .select("*")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Content</h1>
      {!content?.length ? (
        <p className="text-neutral-500 text-sm">Your performance lands here once it&apos;s live. Won&apos;t be long.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((c) => (
            <div key={c.id} className="card p-4">
              {c.thumbnail_url && (
                <img src={c.thumbnail_url} alt={c.title} className="rounded-lg mb-3 aspect-video object-cover w-full" />
              )}
              <p className="font-semibold">{c.title}</p>
              <p className="text-xs text-neutral-500 mt-1">
                {contentTypeLabel(c.content_type)} {c.featured && <span className="text-gold">· Featured</span>}
              </p>
              {c.youtube_url && (
                <a href={c.youtube_url} target="_blank" rel="noopener noreferrer" className="btn-gold text-xs inline-block mt-3">
                  Watch on YouTube
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
