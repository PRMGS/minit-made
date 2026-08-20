import { createClient } from "@/lib/supabase/server";
import { FORMATS } from "@/lib/constants";

export default async function PerformanceGallery({
  heading = "Latest Performances",
  linkText = "Book Yours",
  linkHref = "/apply",
}: {
  heading?: string;
  linkText?: string;
  linkHref?: string;
}) {
  const supabase = await createClient();
  const { data: content } = await supabase
    .from("content_items")
    .select("*")
    .eq("status", "live")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold">{heading}</h2>
        {linkText && (
          <span className="whitespace-nowrap">
            <span className="text-neutral-600 hidden sm:inline">|</span>{" "}
            <a href={linkHref} className="text-gold text-base sm:text-lg">
              {linkText}
            </a>
          </span>
        )}
      </div>

      {content && content.length > 0 ? (
        <div className="scroll-row">
          {content.map((c) => (
            <a
              key={c.id}
              href={c.youtube_url ?? "#"}
              target={c.youtube_url ? "_blank" : undefined}
              className="relative shrink-0 w-64 h-80 rounded-xl overflow-hidden card group"
            >
              {c.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.thumbnail_url} alt={c.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="absolute inset-0 hero-bg" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-0 p-4">
                <p className="text-xs uppercase tracking-wide text-gold mb-1">
                  {FORMATS.find((f) => f.id === c.format)?.name ?? c.content_type}
                </p>
                <p className="font-bold leading-tight">{c.title}</p>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="card p-10 text-center text-neutral-500 text-sm">
          First performances are on the way — check back soon.
        </div>
      )}
    </section>
  );
}
