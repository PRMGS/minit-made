import type { CSSProperties } from "react";

export type BlockStyle = {
  bg?: string;
  color?: string;
  fontSize?: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  fontWeight?: "normal" | "semibold" | "bold" | "extrabold";
  align?: "left" | "center" | "right";
  paddingY?: "none" | "sm" | "md" | "lg" | "xl";
  rounded?: boolean;
  shadow?: boolean;
};

export type BlockType =
  | "heading"
  | "paragraph"
  | "button"
  | "image"
  | "divider"
  | "spacer"
  | "hero"
  | "two_column"
  | "card"
  | "cta"
  | "video"
  | "testimonial"
  | "footer"
  | "social_links"
  | "gallery"
  | "format_row"
  | "content_feed"
  | "email_capture";

export type GalleryItem = { title: string; imageUrl: string; href: string };

export type Block = {
  id: string;
  type: BlockType;
  style: BlockStyle;
  props: Record<string, string>;
  items?: GalleryItem[];
};

export const BRAND_COLORS = ["#000000", "#111111", "#ffffff", "#ffd700", "#b8960a", "#f5f5f5", "#262626"];

export const BLOCK_LIBRARY: { type: BlockType; label: string; group: string }[] = [
  { type: "heading", label: "Heading", group: "Text" },
  { type: "paragraph", label: "Paragraph", group: "Text" },
  { type: "button", label: "Button", group: "Text" },
  { type: "image", label: "Image", group: "Media" },
  { type: "video", label: "Video (YouTube)", group: "Media" },
  { type: "hero", label: "Hero Section", group: "Sections" },
  { type: "two_column", label: "Two-Column Layout", group: "Sections" },
  { type: "card", label: "Card", group: "Sections" },
  { type: "cta", label: "CTA Section", group: "Sections" },
  { type: "testimonial", label: "Testimonial", group: "Sections" },
  { type: "social_links", label: "Social Links", group: "Sections" },
  { type: "footer", label: "Footer", group: "Sections" },
  { type: "gallery", label: "Gallery", group: "Sections" },
  { type: "format_row", label: "Format List", group: "Sections" },
  { type: "content_feed", label: "Latest Performances (live)", group: "Sections" },
  { type: "email_capture", label: "Email Signup", group: "Sections" },
  { type: "divider", label: "Divider", group: "Layout" },
  { type: "spacer", label: "Spacer", group: "Layout" },
];

export function newBlockId() {
  return `blk_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function defaultBlock(type: BlockType): Block {
  const base = { id: newBlockId(), style: {} as BlockStyle };
  switch (type) {
    case "heading":
      return { ...base, type, props: { text: "New Heading" }, style: { fontSize: "3xl", fontWeight: "extrabold" } };
    case "paragraph":
      return { ...base, type, props: { text: "Write something here." } };
    case "button":
      return { ...base, type, props: { text: "Click Me", href: "/apply" } };
    case "image":
      return { ...base, type, props: { url: "", alt: "" } };
    case "divider":
      return { ...base, type, props: {} };
    case "spacer":
      return { ...base, type, props: { height: "md" } };
    case "hero":
      return {
        ...base,
        type,
        props: { heading: "Big Headline", subheading: "Supporting text goes here.", ctaText: "Book Now", ctaHref: "/apply", backgroundImage: "" },
      };
    case "two_column":
      return { ...base, type, props: { leftText: "Left column content.", rightText: "Right column content." } };
    case "card":
      return { ...base, type, props: { title: "Card Title", text: "Card description.", imageUrl: "" } };
    case "cta":
      return { ...base, type, props: { heading: "Ready to book?", buttonText: "Get Started", buttonHref: "/apply" } };
    case "video":
      return { ...base, type, props: { youtubeUrl: "" } };
    case "testimonial":
      return { ...base, type, props: { quote: "This was an incredible experience.", author: "Artist Name" } };
    case "footer":
      return { ...base, type, props: { text: "© Minit Made. All rights reserved." } };
    case "social_links":
      return { ...base, type, props: { instagram: "", tiktok: "", youtube: "" } };
    case "gallery":
      return {
        ...base,
        type,
        props: { heading: "Gallery" },
        items: [
          { title: "Item One", imageUrl: "", href: "" },
          { title: "Item Two", imageUrl: "", href: "" },
        ],
      };
    case "format_row":
      return { ...base, type, props: {} };
    case "content_feed":
      return { ...base, type, props: { heading: "Latest Performances", linkText: "Book Yours", linkHref: "/apply" } };
    case "email_capture":
      return { ...base, type, props: { label: "Minit Made Updates", heading: "Never Miss a Shoot Batch" } };
  }
}

export const FONT_SIZE_CLASS: Record<NonNullable<BlockStyle["fontSize"]>, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-5xl",
};

export const FONT_WEIGHT_CLASS: Record<NonNullable<BlockStyle["fontWeight"]>, string> = {
  normal: "font-normal",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
};

export const PADDING_Y_CLASS: Record<NonNullable<BlockStyle["paddingY"]>, string> = {
  none: "py-0",
  sm: "py-2",
  md: "py-6",
  lg: "py-12",
  xl: "py-24",
};

export const ALIGN_CLASS: Record<NonNullable<BlockStyle["align"]>, string> = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
};

export function blockClassName(style: BlockStyle) {
  return [
    style.fontSize ? FONT_SIZE_CLASS[style.fontSize] : "",
    style.fontWeight ? FONT_WEIGHT_CLASS[style.fontWeight] : "",
    style.paddingY ? PADDING_Y_CLASS[style.paddingY] : "py-2",
    style.align ? ALIGN_CLASS[style.align] : "",
    style.rounded ? "rounded-xl" : "",
    style.shadow ? "shadow-lg" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function blockInlineStyle(style: BlockStyle): CSSProperties {
  return {
    backgroundColor: style.bg || undefined,
    color: style.color || undefined,
  };
}
