import { blockClassName, blockInlineStyle, type Block } from "@/lib/blocks";
import { FORMATS } from "@/lib/constants";
import { extractYoutubeId } from "@/lib/youtube";

const FULL_BLEED_TYPES = new Set(["hero", "cta"]);

export function RenderBlock({ block }: { block: Block }) {
  const cls = blockClassName(block.style);
  const inline = blockInlineStyle(block.style);
  const { type } = block;

  const content = renderContent(block, cls, inline);
  if (FULL_BLEED_TYPES.has(type) || content === null) return content;
  return <div className="max-w-6xl mx-auto px-6">{content}</div>;
}

function renderContent(block: Block, cls: string, inline: ReturnType<typeof blockInlineStyle>) {
  const { type, props } = block;

  switch (type) {
    case "heading":
      return (
        <h2 className={cls} style={inline}>
          {props.text}
        </h2>
      );
    case "paragraph":
      return (
        <p className={`${cls} text-neutral-300 leading-relaxed`} style={inline}>
          {props.text}
        </p>
      );
    case "button":
      return (
        <div className={`${cls}`} style={inline}>
          <a href={props.href || "#"} className="btn-gold inline-block">
            {props.text}
          </a>
        </div>
      );
    case "image":
      return props.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={props.url} alt={props.alt} className={`${cls} w-full object-cover`} style={inline} />
      ) : (
        <div className="border border-dashed border-border rounded-lg p-10 text-center text-neutral-600 text-sm">
          No image set
        </div>
      );
    case "divider":
      return <hr className="border-border my-4" />;
    case "spacer": {
      const h = props.height === "sm" ? "h-4" : props.height === "lg" ? "h-24" : "h-12";
      return <div className={h} />;
    }
    case "hero":
      return (
        <div
          className={`${cls} relative overflow-hidden hero-bg rounded-2xl p-12 md:py-24 text-center space-y-5`}
          style={{ ...inline, backgroundImage: props.backgroundImage ? `url(${props.backgroundImage})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}
        >
          <div className="relative z-10 space-y-5">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none">{props.heading}</h1>
            <p className="text-neutral-300 max-w-2xl mx-auto text-lg">{props.subheading}</p>
            {props.ctaText && (
              <a href={props.ctaHref || "#"} className="btn-gold inline-block text-lg">
                {props.ctaText}
              </a>
            )}
          </div>
        </div>
      );
    case "two_column":
      return (
        <div className={`${cls} grid sm:grid-cols-2 gap-6`} style={inline}>
          <p className="text-neutral-300">{props.leftText}</p>
          <p className="text-neutral-300">{props.rightText}</p>
        </div>
      );
    case "card":
      return (
        <div className={`${cls} card p-5`} style={inline}>
          {props.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.imageUrl} alt="" className="rounded-lg mb-3 w-full object-cover aspect-video" />
          )}
          <h3 className="font-bold text-gold">{props.title}</h3>
          <p className="text-neutral-400 text-sm mt-1">{props.text}</p>
        </div>
      );
    case "cta":
      return (
        <div className={`${cls} text-center space-y-4 py-10`} style={inline}>
          <h2 className="text-2xl font-bold">{props.heading}</h2>
          <a href={props.buttonHref || "#"} className="btn-gold inline-block">
            {props.buttonText}
          </a>
        </div>
      );
    case "video": {
      const id = extractYoutubeId(props.youtubeUrl || "");
      return id ? (
        <div className="aspect-video rounded-lg overflow-hidden">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${id}`}
            title="Video"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="border border-dashed border-border rounded-lg p-10 text-center text-neutral-600 text-sm">
          No video URL set
        </div>
      );
    }
    case "testimonial":
      return (
        <blockquote className={`${cls} border-l-2 border-gold pl-4 italic text-neutral-300`} style={inline}>
          &ldquo;{props.quote}&rdquo;
          <footer className="text-sm text-neutral-500 mt-2 not-italic">— {props.author}</footer>
        </blockquote>
      );
    case "footer":
      return (
        <div className={`${cls} text-center text-neutral-500 text-sm border-t border-border pt-6`} style={inline}>
          {props.text}
        </div>
      );
    case "social_links":
      return (
        <div className={`${cls} flex gap-4 justify-center text-sm`} style={inline}>
          {props.instagram && <a href={props.instagram} className="text-gold">Instagram</a>}
          {props.tiktok && <a href={props.tiktok} className="text-gold">TikTok</a>}
          {props.youtube && <a href={props.youtube} className="text-gold">YouTube</a>}
        </div>
      );
    case "gallery":
      return (
        <div className={cls} style={inline}>
          {props.heading && <h2 className="text-2xl font-bold mb-4">{props.heading}</h2>}
          <div className="scroll-row">
            {(block.items ?? []).map((item, i) => (
              <a
                key={i}
                href={item.href || "#"}
                className="relative shrink-0 w-64 h-80 rounded-xl overflow-hidden card group"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="absolute inset-0 hero-bg" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-4">
                  <p className="font-bold leading-tight">{item.title}</p>
                </div>
              </a>
            ))}
            {!(block.items ?? []).length && (
              <p className="text-neutral-600 text-sm py-6">No items yet — add some in the properties panel.</p>
            )}
          </div>
        </div>
      );
    case "format_row":
      return (
        <div
          className={`${cls} flex flex-wrap justify-center gap-x-5 sm:gap-x-3 gap-y-2 text-sm text-neutral-400`}
          style={inline}
        >
          {FORMATS.map((f, i) => (
            <span key={f.id} className="flex items-center gap-3 whitespace-nowrap">
              {i > 0 && <span className="hidden sm:inline text-neutral-700">|</span>}
              <span>{f.name}</span>
            </span>
          ))}
        </div>
      );
    case "content_feed":
      return (
        <div className={cls} style={inline}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
            <h2 className="text-2xl font-bold">{props.heading}</h2>
            {props.linkText && (
              <a href={props.linkHref || "#"} className="text-gold text-sm whitespace-nowrap">
                {props.linkText}
              </a>
            )}
          </div>
          <div className="border border-dashed border-border rounded-lg p-6 text-center text-neutral-600 text-sm">
            Live performance feed renders here on the published page.
          </div>
        </div>
      );
    case "email_capture":
      return (
        <div className={cls} style={inline}>
          <p className="text-xs uppercase tracking-[0.2em] text-gold mb-2">{props.label}</p>
          <h2 className="text-2xl font-bold mb-3">{props.heading}</h2>
          <div className="border border-dashed border-border rounded-lg p-4 text-center text-neutral-600 text-sm">
            Email signup form renders here on the published page.
          </div>
        </div>
      );
    default:
      return null;
  }
}
