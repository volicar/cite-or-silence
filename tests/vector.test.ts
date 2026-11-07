import { describe, expect, it } from "vitest";
import { cosine, InMemoryStore } from "@/lib/vector";

describe("cosine", () => {
  it("is 1 for identical direction, 0 for orthogonal, 0 for zero vectors", () => {
    expect(cosine([1, 2], [2, 4])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosine([0, 0], [1, 1])).toBe(0);
  });

  it("throws on a dimension mismatch", () => {
    expect(() => cosine([1], [1, 2])).toThrow(/dimension/);
  });
});

describe("InMemoryStore", () => {
  it("returns the nearest chunk first and upserts by id", async () => {
    const store = new InMemoryStore();
    const a = { id: "a", source: "s", heading: "h", text: "a" };
    const b = { id: "b", source: "s", heading: "h", text: "b" };
    await store.upsert([a, b], [[1, 0], [0, 1]]);
    await store.upsert([{ ...a, text: "a2" }], [[1, 0]]);
    const hits = await store.search([1, 0.1], 5);
    expect(hits).toHaveLength(2);
    expect(hits[0]?.chunk.text).toBe("a2");
  });
});
