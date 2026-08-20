import { defaultBlock, newBlockId, type Block } from "@/lib/blocks";

function h(text: string, size: "3xl" | "4xl" = "3xl"): Block {
  return { id: newBlockId(), type: "heading", style: { fontSize: size, fontWeight: "extrabold" }, props: { text } };
}
function p(text: string): Block {
  return { id: newBlockId(), type: "paragraph", style: {}, props: { text } };
}

export const TEMPLATES: { key: string; label: string; blocks: () => Block[] }[] = [
  { key: "blank", label: "Blank", blocks: () => [] },
  {
    key: "landing",
    label: "Landing Page",
    blocks: () => [
      { ...defaultBlock("hero"), props: { heading: "Book Your Performance", subheading: "Real filmed performances for hip-hop, R&B, grime, and freestyle artists.", ctaText: "Apply Now", ctaHref: "/apply", backgroundImage: "" } },
      h("Four Formats. One Standard."),
      { ...defaultBlock("two_column"), props: { leftText: "Hanging Mic — Studio performance with microphone and V-flat", rightText: "Running Gun — Street-style performance at an approved location" } },
      defaultBlock("cta"),
    ],
  },
  {
    key: "faq",
    label: "FAQ",
    blocks: () => [h("Frequently Asked Questions"), p("How does booking work?"), p("Answer goes here."), p("What is the cancellation policy?"), p("Answer goes here.")],
  },
  {
    key: "legal",
    label: "Terms / Privacy",
    blocks: () => [h("Terms of Service"), p("Enter your legal copy here.")],
  },
  {
    key: "contact",
    label: "Contact",
    blocks: () => [h("Get in Touch"), p("Reach us at bookings@minitmade.com"), defaultBlock("social_links")],
  },
  {
    key: "feature",
    label: "Feature Showcase",
    blocks: () => [h("What You Get"), defaultBlock("card"), defaultBlock("card"), defaultBlock("testimonial")],
  },
];
