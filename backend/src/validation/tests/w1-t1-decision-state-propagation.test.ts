import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDecisionCaseState,
  extractCurrentDeliveryDays,
  repairDecisionVisibility,
  assessDecisionVisibilityConsistency,
} from "../../orchestration/pillow-host/executive-decision-case-state.js";

const CORRECTED_CLASS = `Bounded decision — three corridors.

Nova:
contribution 12.80
stock 1200
delivery 5 days
approval granted.

Orion:
contribution 16.40
stock 1600
delivery 4 days
approval pending.

Vega:
contribution 14.10
stock 1100
approval granted
earlier delivery 5 days
later verified corrected delivery 8 days.

Eligibility:
contribution >=10
stock >=1000
delivery <=6
approval granted.

Among eligible corridors select highest contribution.`;

describe("W1-T1 corrected-delivery decision authority", () => {
  it("extractCurrentDeliveryDays prefers corrected over earlier", () => {
    const e = extractCurrentDeliveryDays(
      "earlier delivery 5 days later verified corrected delivery 8 days",
    );
    assert.equal(e.value, 8);
    assert.equal(e.superseded, true);
  });

  it("DecisionCase: sole eligible Nova, Vega FAIL on corrected 8", () => {
    const d = buildDecisionCaseState(CORRECTED_CLASS)!;
    assert.deepEqual(d.eligibleSet, ["Nova"]);
    assert.equal(d.recommendation.status, "SELECT");
    assert.equal(d.recommendation.selectedId, "Nova");
    const vega = d.candidates.find((c) => c.displayName === "Vega")!;
    assert.equal(vega.currentlyEligible, false);
    const del = vega.gates.find((g) => g.id === "delivery_max_days")!;
    assert.equal(del.status, "FAIL");
    assert.match(del.raw || "", /8/);
    assert.ok(d.reversalConditions.some((r) => /Orion.*selection changes to Orion/i.test(r)));
    assert.ok(!d.eligibleSet.includes("Orion"));
  });

  it("repair removes cross-section contradictions for sole eligible", () => {
    const d = buildDecisionCaseState(CORRECTED_CLASS)!;
    const stale = `Eligible set: Nova + Vega. Select Vega.
Vega's 8-day delivery makes Vega ineligible.
DO NOT SELECT ANY.`;
    const fixed = repairDecisionVisibility(stale, d);
    const assess = assessDecisionVisibilityConsistency(fixed, d);
    assert.equal(assess.ok, true, assess.failures.join(","));
    assert.match(fixed, /SELECT\s+Nova/i);
    assert.doesNotMatch(fixed, /DO\s+NOT\s+SELECT\s+ANY/i);
  });
});
