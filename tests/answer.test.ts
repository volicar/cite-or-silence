import { describe, expect, it, vi } from "vitest";
import { ask } from "@/lib/answer";
import { HashEmbedder } from "@/lib/embed";
import { InMemoryStore } from "@/lib/vector";
import type { LLM } from "@/lib/types";

async function setup(llmReply: string) {
  const embedder = new HashEmbedder();
  const store = new InMemoryStore();
  const chunks = [
    { id: "auth#0", source: "auth.md", heading: "Rotating keys", text: "Rotate API keys every 90 days by creating a new key and revoking the old key." },
    { id: "bill#0", source: "billing.md", heading: "Plans", text: "The Pro plan costs 49 dollars per month." },
  ];
  await store.upsert(chunks, await embedder.embed(chunks.map((c) => c.text)));
  const complete = vi.fn(async () => llmReply);
  const llm: LLM = { complete };
  return { deps: { embedder, store, llm, minScore: 0.05 }, complete };
}

describe("ask", () => {
  it("answers with resolved citations when the model cites a provided source", async () => {
    const { deps } = await setup("Create a new key, then revoke the old one [1].");
    const result = await ask("How do I rotate an API key?", deps);
    expect(result.kind).toBe("answer");
    if (result.kind === "answer") expect(result.citations[0]?.source).toBe("auth.md");
  });

  it("abstains WITHOUT calling the model when retrieval is not relevant", async () => {
    const { deps, complete } = await setup("irrelevant");
    const result = await ask("What is the capital of France?", deps);
    expect(result).toEqual({ kind: "abstain", reason: "low_relevance" });
    expect(complete).not.toHaveBeenCalled();
  });

  it("abstains when the model answers without any citation", async () => {
    const { deps } = await setup("Just rotate it whenever you like.");
    const result = await ask("How do I rotate an API key?", deps);
    expect(result).toEqual({ kind: "abstain", reason: "no_valid_citation" });
  });

  it("abstains when the model cites a source number it was never given", async () => {
    const { deps } = await setup("Rotate keys monthly [9].");
    const result = await ask("How do I rotate an API key?", deps);
    expect(result).toEqual({ kind: "abstain", reason: "no_valid_citation" });
  });
});
