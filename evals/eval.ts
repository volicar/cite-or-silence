import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { chunkEmbeddingText, chunkMarkdown } from "../src/lib/chunk";
import { HashEmbedder } from "../src/lib/embed";
import { InMemoryStore } from "../src/lib/vector";
import type { Embedder, VectorStore } from "../src/lib/types";

type Dataset = {
  answerable: { q: string; source: string; heading: string }[];
  unanswerable: string[];
};

export type EvalReport = {
  hitAt1: number;
  hitAt3: number;
  mrr: number;
  abstentionAccuracy: number;
  falseAbstentions: number;
  failures: string[];
};

const here = path.join(process.cwd(), "evals");

export async function buildIndex(embedder: Embedder = new HashEmbedder()): Promise<VectorStore> {
  const corpusDir = path.join(here, "corpus");
  const files = (await readdir(corpusDir)).filter((f) => f.endsWith(".md"));
  const chunks = (
    await Promise.all(files.map(async (f) => chunkMarkdown(f, await readFile(path.join(corpusDir, f), "utf8"))))
  ).flat();
  const store = new InMemoryStore();
  await store.upsert(chunks, await embedder.embed(chunks.map(chunkEmbeddingText)));
  return store;
}

/** Calibrated for HashEmbedder on this corpus: unanswerable best-hit max is 0.00, answerable best-hit min is 0.34. */
export const OFFLINE_MIN_SCORE = 0.05;

export async function runRetrievalEval(minScore = OFFLINE_MIN_SCORE): Promise<EvalReport> {
  const embedder = new HashEmbedder();
  const store = await buildIndex(embedder);
  const dataset = JSON.parse(await readFile(path.join(here, "dataset.json"), "utf8")) as Dataset;

  let hit1 = 0;
  let hit3 = 0;
  let reciprocal = 0;
  let falseAbstentions = 0;
  const failures: string[] = [];

  for (const item of dataset.answerable) {
    const [vector] = await embedder.embed([item.q]);
    const hits = await store.search(vector as number[], 3);
    const rank = hits.findIndex((h) => h.chunk.source === item.source && h.chunk.heading === item.heading);
    if (rank === 0) hit1++;
    if (rank >= 0) hit3++;
    if (rank >= 0) reciprocal += 1 / (rank + 1);
    else failures.push(`miss: "${item.q}"`);
    if ((hits[0]?.score ?? 0) < minScore) falseAbstentions++;
  }

  let correctAbstentions = 0;
  for (const q of dataset.unanswerable) {
    const [vector] = await embedder.embed([q]);
    const hits = await store.search(vector as number[], 1);
    if ((hits[0]?.score ?? 0) < minScore) correctAbstentions++;
    else failures.push(`should abstain: "${q}"`);
  }

  const n = dataset.answerable.length;
  return {
    hitAt1: hit1 / n,
    hitAt3: hit3 / n,
    mrr: reciprocal / n,
    abstentionAccuracy: correctAbstentions / dataset.unanswerable.length,
    falseAbstentions,
    failures,
  };
}
