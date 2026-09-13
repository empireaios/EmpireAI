import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDecisionCaseState,
  extractCurrentDeliveryDays,
  repairDecisionVisibility,
  assessDecisionVisibilityConsistency,
} from "../../orchestration/pillow-host/executive-decision-case-state.js";
import {
  isCommercialArithmeticAsk,
  isGivenMetricDecisionAsk,
  synthesizeCommercialArithmeticAnswer,
} from "../../orchestration/pillow-host/executive-commercial-arithmetic.js";

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

  it("bare contribution numbers in multi-gate packs are given-metric not calc asks", () => {
    const msg =
      "Bounded decision. Piston: contribution 12.5, stock 1200, delivery 5 days, approval granted. Rivet: contribution 16.0, stock 1500, delivery 4 days, approval pending. Anvil: contribution 14.0, stock 1100, approval granted, earlier delivery 5 days, later verified corrected delivery 8 days. Eligibility: contribution >=10, stock >=1000, delivery <=6, approval granted. Select highest contribution among currently eligible.";
    assert.equal(isGivenMetricDecisionAsk(msg), true);
    assert.equal(isCommercialArithmeticAsk(msg), false);
    assert.equal(synthesizeCommercialArithmeticAnswer(msg), null);
    const d = buildDecisionCaseState(msg)!;
    assert.deepEqual(d.eligibleSet, ["Piston"]);
    assert.equal(d.recommendation.selectedId, "Piston");
  });

  it("Helios-shaped Supplier headers: Ember sole eligible; Grove CF changes selection", () => {
    const msg = `Helios must choose one supplier now.
A supplier is currently eligible only if:
* contribution ≥ US$10/order
* stock ≥ 1,000 units
* delivery ≤ 6 days
* approval = granted
Among currently eligible suppliers, choose the supplier with the highest contribution.
Supplier Ember:
* contribution: US$12.50/order
* stock: 1,250
* delivery: 5 days
* approval: granted
Supplier Flint:
* contribution: US$15.80/order
* stock: 1,600
* delivery: 8 days
* approval: granted
Supplier Grove:
* contribution: US$17.20/order
* stock: 1,450
* delivery: 4 days
* approval: pending`;
    const d = buildDecisionCaseState(msg)!;
    assert.deepEqual(d.eligibleSet, ["Ember"]);
    assert.equal(d.recommendation.status, "SELECT");
    assert.equal(d.recommendation.selectedId, "Ember");
    assert.equal(d.candidates.find((c) => c.displayName === "Flint")!.currentlyEligible, false);
    assert.equal(d.candidates.find((c) => c.displayName === "Grove")!.currentlyEligible, false);
    assert.ok(d.candidates.every((c) => c.displayName !== "Approval"));
    assert.ok(d.reversalConditions.some((r) => /Grove.*selection changes to Grove/i.test(r)));
    const toxic = `Current Eligible set: none
Supplier Ember (the only eligible supplier).
Current action: DO NOT SELECT ANY.
Approval: delivery lead-time max days=unproven; contribution minimum=unproven; stock availability=unproven → currentlyEligible=NO`;
    const fixed = repairDecisionVisibility(toxic, d);
    assert.ok(!/Eligible set:\s*none/i.test(fixed) || /Eligible set:\s*Ember/i.test(fixed));
    assert.ok(!/\bDO NOT SELECT ANY\b/i.test(fixed));
    assert.ok(/SELECT Ember/i.test(fixed) || /Eligible (?:set|Suppliers?):\s*Ember/i.test(fixed));
  });
});
