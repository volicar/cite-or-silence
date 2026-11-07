import type { Chunk } from "./types";

export type ChunkOptions = { maxChars: number; overlap: number };

const DEFAULTS: ChunkOptions = { maxChars: 700, overlap: 100 };

/**
 * Splits markdown into heading-aware chunks. Each chunk keeps the heading it
 * lives under, so a citation can point at a human-readable section.
 */
export function chunkMarkdown(
  source: string,
  markdown: string,
  options: Partial<ChunkOptions> = {},
): Chunk[] {
  const { maxChars, overlap } = { ...DEFAULTS, ...options };
  if (overlap >= maxChars) throw new Error("overlap must be smaller than maxChars");

  const sections: { heading: string; body: string }[] = [];
  let heading = source;
  let buffer: string[] = [];
  const flush = () => {
    const body = buffer.join("\n").trim();
    if (body) sections.push({ heading, body });
    buffer = [];
  };

  for (const line of markdown.split("\n")) {
    const match = /^#{1,6}\s+(.*)$/.exec(line);
    if (match) {
      flush();
      heading = (match[1] ?? "").trim() || source;
    } else {
      buffer.push(line);
    }
  }
  flush();

  const chunks: Chunk[] = [];
  for (const section of sections) {
    const paragraphs = section.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    let current = "";
    const push = () => {
      const text = current.trim();
      if (text) chunks.push({ id: `${source}#${chunks.length}`, source, heading: section.heading, text });
    };
    for (const paragraph of paragraphs) {
      if (current && current.length + paragraph.length + 2 > maxChars) {
        push();
        current = current.slice(-overlap).trimStart();
      }
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
    push();
  }
  return chunks;
}

/**
 * What we actually embed. Prefixing the section heading gives each chunk the
 * context a reader would have, which helps when the body alone is ambiguous.
 */
export function chunkEmbeddingText(chunk: Chunk): string {
  return `${chunk.heading}\n${chunk.text}`;
}
