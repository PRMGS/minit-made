import { normalizeBlocks } from "@/lib/pageBlocks";
import { RenderBlock } from "@/lib/renderBlock";
import PerformanceGallery from "@/app/PerformanceGallery";
import EmailCapture from "@/app/EmailCapture";

export default function PageBlocksRenderer({ content }: { content: unknown }) {
  const blocks = normalizeBlocks(content);

  return (
    <div className="space-y-14 md:space-y-20">
      {blocks.map((b) => {
        const anchor = b.props.anchor;
        if (b.type === "content_feed") {
          return (
            <div key={b.id} id={anchor}>
              <PerformanceGallery heading={b.props.heading} linkText={b.props.linkText} linkHref={b.props.linkHref} />
            </div>
          );
        }
        if (b.type === "email_capture") {
          return (
            <div key={b.id} id={anchor}>
              <EmailCapture label={b.props.label} heading={b.props.heading} />
            </div>
          );
        }
        return (
          <div key={b.id} id={anchor}>
            <RenderBlock block={b} />
          </div>
        );
      })}
    </div>
  );
}
