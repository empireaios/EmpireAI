import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDecisionCaseState } from "../../orchestration/pillow-host/executive-decision-case-state.js";

describe("comma contribution ranking (D-002)", () => {
  it("ranks US$5,000 above US$4,950", () => {
    const msg = `SYNTHETIC. Select highest contribution among eligible.
Alpha: contribution US$4,950 stock 2000 delivery 3 days approval granted.
Beta: contribution US$5,000 stock 2000 delivery 3 days approval granted.
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.`;
    const d = buildDecisionCaseState(msg)!;
    assert.equal(d.candidates.find((c) => c.displayName === "Alpha")?.supportedMetric, 4950);
    assert.equal(d.candidates.find((c) => c.displayName === "Beta")?.supportedMetric, 5000);
    assert.equal(d.recommendation.selectedId, "Beta");
  });
});
