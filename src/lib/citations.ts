import type { Citation, ScoredChunk } from "./types";

/** Extracts the numbers used in markers like [1] or [2][3]. */
export function extractCitationNumbers(text: string): number[] {
  const numbers = new Set<number>();
  for (const match of text.matchAll(/\[(\d{1,2})\]/g)) numbers.add(Number(match[1]));
  return [...numbers].sort((a, b) => a - b);
}

/**
 * Returns the resolved citations, or null when the answer cites nothing or
 * cites a source number that was never provided to the model.
 */
export function resolveCitations(text: string, hits: ScoredChunk[]): Citation[] | null {
  const numbers = extractCitationNumbers(text);
  if (numbers.length === 0) return null;
  const citations: Citation[] = [];
  for (const n of numbers) {
    const hit = hits[n - 1];
    if (!hit) return null;
    citations.push({ n, source: hit.chunk.source, heading: hit.chunk.heading, chunkId: hit.chunk.id });
  }
  return citations;
}
