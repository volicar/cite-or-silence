import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Chunk, ScoredChunk, VectorStore } from "./types";

export class SupabaseStore implements VectorStore {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  }

  async upsert(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    const rows = chunks.map((chunk, i) => ({ ...chunk, embedding: embeddings[i] }));
    const { error } = await this.client.from("chunks").upsert(rows);
    if (error) throw new Error(`upsert failed: ${error.message}`);
  }

  async search(embedding: number[], k: number): Promise<ScoredChunk[]> {
    const { data, error } = await this.client.rpc("match_chunks", {
      query_embedding: embedding,
      match_count: k,
    });
    if (error) throw new Error(`search failed: ${error.message}`);
    return (data ?? []).map(
      (row: { id: string; source: string; heading: string; text: string; score: number }) => ({
        chunk: { id: row.id, source: row.source, heading: row.heading, text: row.text },
        score: row.score,
      }),
    );
  }
}
