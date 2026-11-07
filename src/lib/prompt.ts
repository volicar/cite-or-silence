import type { ScoredChunk } from "./types";

export const SYSTEM_PROMPT = [
  "You answer questions using ONLY the numbered sources provided.",
  "Cite every claim with its source number in square brackets, like [1].",
  "If the sources do not contain the answer, reply exactly: I don't have enough information.",
  "Never use outside knowledge. Keep answers short and factual.",
].join(" ");

export function buildUserPrompt(question: string, hits: ScoredChunk[]): string {
  const sources = hits
    .map((hit, i) => `[${i + 1}] (${hit.chunk.source} > ${hit.chunk.heading})\n${hit.chunk.text}`)
    .join("\n\n");
  return `Sources:\n\n${sources}\n\nQuestion: ${question}`;
}
