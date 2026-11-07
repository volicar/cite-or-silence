import { describe, expect, it } from "vitest";
import { chunkMarkdown } from "@/lib/chunk";

describe("chunkMarkdown", () => {
  it("keeps the heading each chunk lives under", () => {
    const chunks = chunkMarkdown("doc.md", "# Title\n\n## First\n\nAlpha text.\n\n## Second\n\nBeta text.");
    expect(chunks.map((c) => c.heading)).toEqual(["First", "Second"]);
    expect(chunks[0]?.text).toBe("Alpha text.");
  });

  it("splits long sections and carries overlap into the next chunk", () => {
    const paragraph = "word ".repeat(60).trim();
    const chunks = chunkMarkdown("doc.md", `## Long\n\n${paragraph}\n\n${paragraph}\n\n${paragraph}`, {
      maxChars: 400,
      overlap: 50,
    });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.text.length <= 400 + 50)).toBe(true);
    expect(new Set(chunks.map((c) => c.id)).size).toBe(chunks.length);
  });

  it("rejects an overlap that is not smaller than the chunk size", () => {
    expect(() => chunkMarkdown("d.md", "# a\n\nb", { maxChars: 100, overlap: 100 })).toThrow();
  });

  it("ignores empty documents", () => {
    expect(chunkMarkdown("empty.md", "\n\n")).toEqual([]);
  });
});
