import type { Embedder } from "./types";

const STOPWORDS = new Set(
  "a an the and or of to in on for with is are was were be been it this that these those as at by from how what when where which who why do does can i you we".split(" "),
);

/** Very light suffix stripping so "rotate", "rotating" and "rotated" share a stem. */
export function stem(token: string): string {
  if (token.length <= 4) return token;
  return token
    .replace(/(ies|ied)$/, "y")
    .replace(/(ing|ed|es|s)$/, "")
    .replace(/e$/, "");
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

/**
 * Deterministic hashed bag-of-words embedder. It needs no API key, so CI can
 * run the full retrieval eval offline. It is NOT a substitute for a real model.
 */
export class HashEmbedder implements Embedder {
  constructor(private readonly dims = 4096) {}

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map((text) => {
      const vector = new Array<number>(this.dims).fill(0);
      for (const token of tokenize(text)) {
        let h = 2166136261;
        for (let i = 0; i < token.length; i++) {
          h ^= token.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        // Avalanche finalizer: raw FNV-1a has weak low bits, which causes avoidable collisions.
        h ^= h >>> 16;
        h = Math.imul(h, 0x85ebca6b);
        h ^= h >>> 13;
        h = Math.imul(h, 0xc2b2ae35);
        h ^= h >>> 16;
        const index = (h >>> 0) % this.dims;
        vector[index] = (vector[index] ?? 0) + 1;
      }
      return vector;
    });
  }
}

export class OpenAIEmbedder implements Embedder {
  constructor(
    private readonly apiKey: string,
    private readonly model = "text-embedding-3-small",
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!response.ok) throw new Error(`Embeddings request failed: ${response.status}`);
    const json = (await response.json()) as { data: { index: number; embedding: number[] }[] };
    return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }
}
