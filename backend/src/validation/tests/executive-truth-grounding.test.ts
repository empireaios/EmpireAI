import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";
import { enforceExecutiveTruthGrounding } from "../../orchestration/pillow-host/executive-release-gate.js";

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
});
