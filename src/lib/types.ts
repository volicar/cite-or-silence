export type Chunk = {
  id: string;
  source: string;
  heading: string;
  text: string;
};

export type ScoredChunk = { chunk: Chunk; score: number };

export interface Embedder {
  embed(texts: string[]): Promise<number[][]>;
}

export interface VectorStore {
  upsert(chunks: Chunk[], embeddings: number[][]): Promise<void>;
  search(embedding: number[], k: number): Promise<ScoredChunk[]>;
}

export interface LLM {
  complete(system: string, user: string): Promise<string>;
}

export type Citation = { n: number; source: string; heading: string; chunkId: string };

export type AskResult =
  | { kind: "answer"; text: string; citations: Citation[] }
  | { kind: "abstain"; reason: "low_relevance" | "no_valid_citation" };
