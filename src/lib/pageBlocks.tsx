import { newBlockId, type Block } from "@/lib/blocks";

type LegacyBlock = { type: "heading" | "paragraph" | "image"; text?: string; url?: string; alt?: string };

function migrateLegacyBlock(b: LegacyBlock): Block {
  if (b.type === "image") {
    return { id: newBlockId(), type: "image", style: {}, props: { url: b.url ?? "", alt: b.alt ?? "" } };
  }
  return {
    id: newBlockId(),
    type: b.type,
    style: b.type === "heading" ? { fontSize: "3xl", fontWeight: "extrabold" } : {},
    props: { text: b.text ?? "" },
  };
}

export function normalizeBlocks(content: unknown): Block[] {
  const raw = (content as { blocks?: (Block | LegacyBlock)[] } | null)?.blocks ?? [];
  return raw.map((b) => ("id" in b && "props" in b ? (b as Block) : migrateLegacyBlock(b as LegacyBlock)));
}
