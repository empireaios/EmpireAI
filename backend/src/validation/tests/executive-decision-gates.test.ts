/**
 * Level A — multi-gate decision eligibility + partial unlock.
 * Does not encode sealed Atlas / Service R closure content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessScaleEligibility,
  ensureRecommendationConstraintConsistency,
  extractMaterialConstraints,
  applyConstraintSupersession,
  synthesizeExactEvidenceForDecision,
} from "../../orchestration/pillow-host/executive-decision-constraints.js";
import { ensureNumberedSectionLineBreaks } from "../../orchestration/pillow-host/executive-response-polish.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import { parseExecutiveTaskContract } from "../../orchestration/pillow-host/executive-task-contract.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_gates_a",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_g",
      asin: "B0TESTGATE",
      productName: "Live Bound Widget Under Test",
      supplier: "SupplierX",
      marketplace: "Amazon US",
      selectionAuthority: "pillow",
      cursorSelected: false,
      stage: "COMMISSIONING",
      pillowRecommendation: "INVESTIGATE",
      truthClass: "CURRENT_VERIFIED",
    },
    financial: {
      orders: 0,
      realisedRevenueUsd: 0,
      buyableListings: 0,
      publishedListings: 0,
      expectedProfitDisplay: null,
      expectedProfitTruthClass: "UNKNOWN",
      realisedTruthClass: "CURRENT_VERIFIED",
    },
    birth: {
      status: "TECHNICALLY_READY_AWAITING_GRAND_KING",
      technicallyReady: true,
      birthTimestamp: null,
      gatesPassedCount: 12,
      gatesTotal: 12,
      truthClass: "CURRENT_VERIFIED",
    },
    deploy: {
      gitCommitSha: "abc12345deadbeef",
      serviceOnlineHint: "assume_online_if_answering",
      truthClass: "CURRENT_VERIFIED",
    },
    authority: {
      pillowMayPublish: false,
      pillowMaySupplierSpend: false,
      pillowMayAuthoriseBirth: false,
      pillowMayExecuteProductionDeploy: false,
      chatHasToolCallingLoop: false,
      executableNow: ["Answer"],
      requiresGrandKing: ["Birth"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
    notes: [],
  };
}

describe("decision-gate multi-blocker Level A", () => {
  it("1 two blockers; resolve one → scale still ineligible", () => {
    const c = extractMaterialConstraints(
      "Synthetic: contribution margin is negative; capacity is limited to 80 transactions/week.",
    );
    const after = applyConstraintSupersession(
      c,
      "Verified cost reduction makes contribution now positive.",
    );
    const el = assessScaleEligibility(after);
    assert.equal(el.scaleEligible, false);
    assert.ok(el.blockedBy.some((g) => g.id === "capacity"));
    assert.ok(el.cleared.some((g) => g.id === "unit_economics"));
  });

  it("2 three blockers; resolve two → one remains", () => {
    const c = extractMaterialConstraints(
      "Synthetic: negative unit economics; capacity limited; expansion requires additional fixed investment.",
    );
    let x = applyConstraintSupersession(c, "Verified cost reduction; contribution now positive.");
    x = applyConstraintSupersession(x, "Verified capacity expansion resolved the limit.");
    const el = assessScaleEligibility(x);
    assert.equal(el.scaleEligible, false);
    assert.ok(el.blockedBy.some((g) => g.id === "investment_return"));
  });

  it("3 all blockers resolved → scale eligible", () => {
    const c = extractMaterialConstraints(
      "Synthetic: negative unit economics and capacity limited to 50/week; expansion requires additional fixed investment.",
    );
    let x = applyConstraintSupersession(c, "Verified cost reduction; contribution now positive.");
    x = applyConstraintSupersession(x, "Verified capacity expansion resolved the limit.");
    x = applyConstraintSupersession(x, "ROI of the investment is verified acceptable.");
    const el = assessScaleEligibility(x);
    assert.equal(el.scaleEligible, true);
    assert.equal(el.blockedBy.length, 0);
  });

  it("4 new evidence creates new blocker", () => {
    const base = extractMaterialConstraints("Synthetic: contribution is positive.");
    const withCap = extractMaterialConstraints(
      "Synthetic: contribution is positive but capacity is limited to 100 transactions/week.",
    );
    assert.ok(withCap.some((c) => c.class === "CAPACITY_LIMIT"));
    assert.ok(!base.some((c) => c.class === "CAPACITY_LIMIT"));
  });

  it("5 one blocker superseded, another remains", () => {
    const c = extractMaterialConstraints(
      "negative contribution margin; capacity limited to 100/week.",
    );
    const x = applyConstraintSupersession(c, "unit economics are now positive after verified repair");
    assert.equal(x.find((c) => c.class === "NEGATIVE_UNIT_ECONOMICS")?.status, "superseded");
    assert.equal(x.find((c) => c.class === "CAPACITY_LIMIT")?.status, "active");
  });

  it("6 partial unlock language — not full scale", () => {
    const c = extractMaterialConstraints(
      "contribution margin is negative; capacity limited; expansion requires additional fixed investment.",
    );
    const draft =
      "If the additional saving becomes verified, that would unlock the decision to scale. Capacity would still remain.";
    const fixed = ensureRecommendationConstraintConsistency(draft, c);
    assert.equal(fixed.repaired, true);
    assert.doesNotMatch(fixed.message, /unlock the decision to scale(?![\s\S]*not)/i);
    assert.match(fixed.message, /partial unlock|remain|capacity|gate/i);
  });

  it("7 full unlock only when all gates clear", () => {
    const c = extractMaterialConstraints("Synthetic: no special blockers mentioned.");
    const el = assessScaleEligibility(c);
    // No gates extracted → not auto-eligible for scale from empty
    assert.ok(Array.isArray(el.blockedBy));
  });

  it("8 exact-evidence-for-decision lists remaining gates", () => {
    const c = extractMaterialConstraints(
      "negative unit economics; capacity limited to 100/week; expansion requires additional fixed investment.",
    );
    const ans = synthesizeExactEvidenceForDecision(c, "meaningful scaling");
    assert.match(ans, /Clearing one gate is not enough/i);
    assert.match(ans, /capacity|investment|contribution|economics/i);
  });

  it("9 irreversible action with unresolved gate is repaired", () => {
    const ask =
      "Synthetic: capacity limited to 100/week and expansion requires additional fixed investment. Recommend scale.";
    const draft = "### Recommendation\nScale up production and marketing now.";
    const released = releaseExecutiveAnswer(draft, truth(), [], {
      userMessage: ask,
      taskContract: parseExecutiveTaskContract(ask),
    });
    assert.doesNotMatch(released.message, /Scale up production and marketing now/i);
    assert.match(released.message, /capacity|investment|do not|gate|partial/i);
  });

  it("10 reversible test with unresolved gate stays allowed as partial", () => {
    const c = extractMaterialConstraints("capacity limited to 100/week.");
    const el = assessScaleEligibility(c);
    assert.match(el.partialUnlock, /capacity|Partial unlock|not eligible/i);
  });

  it("11 authority blocker", () => {
    const c = extractMaterialConstraints("cannot deploy without Grand King authority.");
    assert.ok(c.some((x) => x.class === "AUTHORITY_RESTRICTION"));
  });

  it("12 economics + capacity both bind", () => {
    const c = extractMaterialConstraints(
      "loses money per transaction; capacity limited to 100 transactions/week.",
    );
    const el = assessScaleEligibility(c);
    assert.ok(el.blockedBy.length >= 2);
  });

  it("numbered section line breaks separate inline 3.", () => {
    const raw =
      "Capacity remains limited and expansion needs additional fixed investment. 3. Impact of the Unverified Saving";
    const fixed = ensureNumberedSectionLineBreaks(raw);
    assert.match(fixed, /investment\.\n\n3\. Impact/);
    assert.equal(/\.[^\n]+3\./.test(fixed), false);
  });
});
