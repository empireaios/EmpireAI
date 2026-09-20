import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";
import { enforceExecutiveTruthGrounding } from "../../orchestration/pillow-host/executive-release-gate.js";
import { authorizeTransportRelease } from "../../orchestration/pillow-host/executive-final-visible-contract.js";
import { realizeDomainNativeMemorySurface } from "../../orchestration/pillow-host/executive-memory-realization.js";

function baseTruth(over: Partial<ExecutiveTruthSnapshot> = {}): ExecutiveTruthSnapshot {
  const base: ExecutiveTruthSnapshot = {
    computedAt: "2026-08-12T14:00:00.000Z",
    workspaceId: "ws_test",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_test",
      asin: "B0FKFNCT52",
      productName: "High-Speed Handheld Mini Fan With Digital Display",
      supplier: "CJdropshipping",
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
      expectedProfitDisplay: "$1.00",
      expectedProfitTruthClass: "ESTIMATED",
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
      gitCommitSha: "abc123",
      serviceOnlineHint: "assume_online_if_answering",
      truthClass: "CURRENT_VERIFIED",
    },
    authority: {
      pillowMayPublish: false,
      pillowMaySupplierSpend: false,
      pillowMayAuthoriseBirth: false,
      pillowMayExecuteProductionDeploy: false,
      chatHasToolCallingLoop: false,
      executableNow: ["Answer questions"],
      requiresGrandKing: ["Authorise Birth", "Production deploy"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
    notes: ["test"],
  };
  return {
    ...base,
    ...over,
    product: { ...base.product, ...(over.product ?? {}) },
    financial: { ...base.financial, ...(over.financial ?? {}) },
    birth: { ...base.birth, ...(over.birth ?? {}) },
    deploy: { ...base.deploy, ...(over.deploy ?? {}) },
    authority: { ...base.authority, ...(over.authority ?? {}) },
  };
}

describe("executive-truth-grounding via release gate", () => {
  it("corrects ASIN product identity mismatch without hard-coding Birth answers", () => {
    const result = enforceExecutiveTruthGrounding(
      "The current product ASIN B0FKFNCT52 is Resistance Bands Set chosen for high demand score.",
      baseTruth(),
    );
    assert.equal(result.adjusted, true);
    assert.ok(result.violations.includes("PRODUCT_IDENTITY_MISMATCH"));
    assert.match(result.message, /Mini Fan/);
    assert.doesNotMatch(result.message, /Resistance Bands Set/i);
  });

  it("blocks fabricated sales when realised commerce is zero", () => {
    const result = enforceExecutiveTruthGrounding(
      "KNOW: last quarter declining product sales and customer feedback ratings show misalignment. Evidenced.",
      baseTruth(),
    );
    assert.equal(result.adjusted, true);
    assert.ok(result.violations.includes("FABRICATED_COMMERCE_OR_FINANCIAL_CLAIM"));
    assert.ok(result.violations.includes("UNSUPPORTED_MARKED_EVIDENCED"));
    assert.match(result.message, /unproven|established|realised orders|don't have verified/i);
    assert.doesNotMatch(result.message, /Evidenced/i);
  });

  it("blocks false production-deploy authority claims", () => {
    const result = enforceExecutiveTruthGrounding(
      "I can execute production deployment under the operational playbook.",
      baseTruth(),
    );
    assert.equal(result.adjusted, true);
    assert.ok(result.violations.includes("FALSE_DEPLOY_AUTHORITY"));
    assert.doesNotMatch(result.message, /I can execute production deployment under the operational playbook/i);
  });

  it("blocks stale B5/P0-1 as current when deploy/birth ready", () => {
    const result = enforceExecutiveTruthGrounding(
      "Complete Production Deployment (P0-1) — Blocker B5 proves production deployment has not occurred.",
      baseTruth(),
    );
    assert.equal(result.adjusted, true);
    assert.ok(result.violations.includes("STALE_HISTORICAL_BLOCKER_AS_CURRENT"));
  });

  it("blocks current-blocked claims when Brain is live with deploy SHA", () => {
    const result = enforceExecutiveTruthGrounding(
      "UNKNOWN. The production deployment is currently blocked by unresolved historical certification items, specifically B6, B7, and B8.",
      baseTruth(),
    );
    assert.equal(result.adjusted, true);
    assert.ok(result.violations.includes("STALE_HISTORICAL_BLOCKER_AS_CURRENT"));
  });

  it("does not false-positive when ASIN mentioned without inventing another title", () => {
    const result = enforceExecutiveTruthGrounding(
      "ASIN B0FKFNCT52 has realised orders=0 and realisedRevenueUsd=0. Sales history is UNKNOWN.",
      baseTruth(),
    );
    assert.equal(result.adjusted, false);
    assert.deepEqual(result.violations, []);
  });

  it("passes grounded answers unchanged", () => {
    const result = enforceExecutiveTruthGrounding(
      "CURRENT_VERIFIED: ASIN B0FKFNCT52 is the High-Speed Handheld Mini Fan. Realised orders are 0 — sales history is UNKNOWN. I cannot execute production deployment.",
      baseTruth(),
    );
    assert.equal(result.adjusted, false);
    assert.deepEqual(result.violations, []);
  });

  it("never authorizes an empty final answer after semantic writers", () => {
    for (const answer of ["", "  \n\t "]) {
      const result = authorizeTransportRelease({answer, userMessage: "What can be verified?", expectedTopLevelSections: null, claims: []});
      assert.equal(result.authorized, false);
      assert.ok(result.assessment.failures.includes("EMPTY_VISIBLE_ANSWER"));
      assert.ok(result.message.trim().length > 0);
    }
  });

  it("keeps current-reality sales uncertainty while removing it from unrelated synthetic cases", () => {
    const correction = "I don't have verified sales-history evidence beyond realised orders — so I won't treat those performance claims as established.";
    const live = realizeDomainNativeMemorySurface(correction, "What do we know about our product sales?", false);
    assert.equal(live.message, correction);
    assert.equal(live.telemetry.LESSON_TEXT_SURFACED, false);
    const synthetic = realizeDomainNativeMemorySurface(`The pump stopped at 08:00. ${correction}`, "Synthetic industrial chronology analysis only.", true);
    assert.match(synthetic.message, /pump stopped at 08:00/);
    assert.doesNotMatch(synthetic.message, /sales-history|realised orders/);
  });

  for (const draft of [
    "Our sales figures confirm 63 units sold and a conversion rate of 8 percent. Evidenced.",
    "Customer feedback ratings and historical sales show this offer already succeeds.",
    "Revenue was $8,900 last quarter, proving demand for this product.",
  ]) {
    it(`unfamiliar unsupported commercial assertion produces a nonempty grounded correction: ${draft}`, () => {
      const truth = baseTruth();
      truth.financial.expectedProfitDisplay = null;
      truth.financial.expectedProfitTruthClass = "UNKNOWN";
      for (const userMessage of [undefined, "What commercial results are actually established for our product?"]) {
        const result = enforceExecutiveTruthGrounding(draft, truth, [], {userMessage});
        assert.equal(result.adjusted, true);
        assert.ok(result.violations.includes("FABRICATED_COMMERCE_OR_FINANCIAL_CLAIM"));
        assert.ok(result.message.trim().length > 20, result.message);
        assert.match(result.message, /not.*established|unproven|don't have verified/i);
        assert.doesNotMatch(result.message, /63|8 percent|8,900|Evidenced|already succeeds/);
        assert.equal(result.telemetry.finalRevalidationPass, true);
      }
    });
  }
});
