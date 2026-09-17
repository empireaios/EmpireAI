import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDecisionCaseState } from "../../orchestration/pillow-host/executive-decision-case-state.js";

describe("later correction supersedes earlier delivery (D-003)", () => {
  it("uses corrected delivery for eligibility", () => {
    const msg = `SYNTHETIC candidate evaluation.
Reed:
- contribution: US$12
- stock: 1500
- earlier delivery: 9 days
- later corrected delivery: 4 days
- approval: granted
Eligibility: contribution at least US$8, stock at least 1000, delivery no more than 6 days, approval granted.
Select sole eligible.`;
    const d = buildDecisionCaseState(msg)!;
    const reed = d.candidates.find((c) => c.displayName === "Reed");
    assert.ok(reed);
    assert.equal(reed!.currentlyEligible, true);
    assert.equal(d.recommendation.selectedId, "Reed");
  });
});
