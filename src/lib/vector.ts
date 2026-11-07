import type { Chunk, ScoredChunk, VectorStore } from "./types";

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error(`dimension mismatch: ${a.length} vs ${b.length}`);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** In-memory store used by tests and the offline eval suite. */
export class InMemoryStore implements VectorStore {
  private rows: { chunk: Chunk; embedding: number[] }[] = [];

  async upsert(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    if (chunks.length !== embeddings.length) throw new Error("chunks and embeddings must align");
    chunks.forEach((chunk, i) => {
      const embedding = embeddings[i] as number[];
      const existing = this.rows.findIndex((r) => r.chunk.id === chunk.id);
      if (existing >= 0) this.rows[existing] = { chunk, embedding };
      else this.rows.push({ chunk, embedding });
    });
  }

  async search(embedding: number[], k: number): Promise<ScoredChunk[]> {
    return this.rows
      .map((r) => ({ chunk: r.chunk, score: cosine(embedding, r.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}
