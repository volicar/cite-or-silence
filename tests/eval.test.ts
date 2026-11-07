import { describe, expect, it } from "vitest";
import { runRetrievalEval } from "../evals/eval";

describe("retrieval eval (regression gate)", () => {
  it("keeps retrieval quality above the agreed thresholds", async () => {
    const report = await runRetrievalEval();
    expect(report.failures).toEqual([]);
    expect(report.hitAt1).toBeGreaterThanOrEqual(0.85);
    expect(report.hitAt3).toBeGreaterThanOrEqual(0.95);
    expect(report.abstentionAccuracy).toBe(1);
    expect(report.falseAbstentions).toBe(0);
  });
});
