import { describe, expect, it } from "vitest";
import { extractCitationNumbers, resolveCitations } from "@/lib/citations";

const hit = (id: string) => ({ chunk: { id, source: `${id}.md`, heading: "H", text: "t" }, score: 0.9 });

describe("citations", () => {
  it("extracts unique, sorted citation numbers", () => {
    expect(extractCitationNumbers("Use keys [2]. Rotate them [1][2].")).toEqual([1, 2]);
  });

  it("resolves numbers to the sources that were provided", () => {
    const result = resolveCitations("Answer [2].", [hit("a"), hit("b")]);
    expect(result).toEqual([{ n: 2, source: "b.md", heading: "H", chunkId: "b" }]);
  });

  it("returns null when nothing is cited", () => {
    expect(resolveCitations("No markers here.", [hit("a")])).toBeNull();
  });

  it("returns null when a cited source does not exist (hallucinated citation)", () => {
    expect(resolveCitations("Answer [3].", [hit("a"), hit("b")])).toBeNull();
  });
});
