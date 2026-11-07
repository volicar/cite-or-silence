import Anthropic from "@anthropic-ai/sdk";
import { resolveCitations } from "./citations";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import type { AskResult, Embedder, LLM, VectorStore } from "./types";

export type AskDeps = {
  embedder: Embedder;
  store: VectorStore;
  llm: LLM;
  /**
   * Minimum cosine similarity of the best hit. Below it we abstain without calling the model.
   * Required on purpose: the right value depends on the embedding model, so calibrate it
   * against your own eval set instead of trusting a default.
   */
  minScore: number;
  topK?: number;
};

/**
 * The core idea: answer with verifiable citations, or stay silent.
 * Retrieval gates the model call, and a post-check rejects answers whose
 * citations do not map to the sources we actually provided.
 */
export async function ask(question: string, deps: AskDeps): Promise<AskResult> {
  const { embedder, store, llm, minScore, topK = 4 } = deps;

  const [queryEmbedding] = await embedder.embed([question]);
  if (!queryEmbedding) throw new Error("embedder returned no vector");

  const hits = await store.search(queryEmbedding, topK);
  const best = hits[0];
  if (!best || best.score < minScore) return { kind: "abstain", reason: "low_relevance" };

  const text = (await llm.complete(SYSTEM_PROMPT, buildUserPrompt(question, hits))).trim();
  const citations = resolveCitations(text, hits);
  if (!citations) return { kind: "abstain", reason: "no_valid_citation" };

  return { kind: "answer", text, citations };
}

export class ClaudeLLM implements LLM {
  private readonly client: Anthropic;

  constructor(apiKey: string, private readonly model = "claude-haiku-5-5") {
    this.client = new Anthropic({ apiKey });
  }

  async complete(system: string, user: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 400,
      temperature: 0,
      system,
      messages: [{ role: "user", content: user }],
    });
    return message.content.map((block) => (block.type === "text" ? block.text : "")).join("");
  }
}
