/**
 * Level A — decision-constraint persistence + recommendation consistency.
 * Does not encode sealed Wave 1 / Meridian closure content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyConstraintSupersession,
  ensureRecommendationConstraintConsistency,
  extractMaterialConstraints,
  recommendationViolatesConstraints,
  synthesizeConstraintAwareRecommendation,
} from "../../orchestration/pillow-host/executive-decision-constraints.js";
import {
  parseExecutiveTaskContract,
  synthesizeTaskUnitAnswer,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_constraint_a",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_c",
      asin: "B0TESTCONST",
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

describe("decision-constraint persistence Level A", () => {
  it("1 strong demand + negative unit economics → scale violates", () => {
    const c = extractMaterialConstraints(
      "Synthetic: demand looks strong but contribution margin is negative per completed sale.",
    );
    assert.ok(c.some((x) => x.class === "NEGATIVE_UNIT_ECONOMICS" && x.status === "active"));
    const hit = recommendationViolatesConstraints(
      "I recommend we scale up production and marketing efforts.",
      c,
    );
    assert.equal(hit?.class, "NEGATIVE_UNIT_ECONOMICS");
  });

  it("2 weak demand + positive economics does not invent negative constraint", () => {
    const c = extractMaterialConstraints(
      "Synthetic: demand is unverified; estimated contribution margin is positive if the estimate holds.",
    );
    assert.ok(c.some((x) => x.class === "UNVERIFIED_DEMAND"));
    assert.ok(!c.some((x) => x.class === "NEGATIVE_UNIT_ECONOMICS"));
  });

  it("3 strong demand + capacity constraint blocks throughput scale", () => {
    const c = extractMaterialConstraints(
      "Synthetic: demand is strong but warehouse capacity is exhausted.",
    );
    assert.ok(c.some((x) => x.class === "CAPACITY_LIMIT"));
    const hit = recommendationViolatesConstraints("Scale production immediately.", c);
    assert.equal(hit?.class, "CAPACITY_LIMIT");
  });

  it("4 attractive opportunity + authority blocker", () => {
    const c = extractMaterialConstraints(
      "Synthetic: attractive launch opportunity but cannot deploy without Grand King authority.",
    );
    assert.ok(c.some((x) => x.class === "AUTHORITY_RESTRICTION"));
  });

  it("5 newer evidence supersedes previous negative economics", () => {
    const before = extractMaterialConstraints(
      "Contribution margin is negative per sale.",
    );
    const after = applyConstraintSupersession(
      before,
      "Verified cost reduction makes contribution margin now positive.",
    );
    assert.equal(
      after.find((x) => x.class === "NEGATIVE_UNIT_ECONOMICS")?.status,
      "superseded",
    );
  });

  it("6 verification resolves only one of two blockers", () => {
    const c = extractMaterialConstraints(
      "Demand is unverified and contribution margin is negative per unit.",
    );
    assert.ok(c.some((x) => x.class === "UNVERIFIED_DEMAND"));
    assert.ok(c.some((x) => x.class === "NEGATIVE_UNIT_ECONOMICS"));
    // Demand verification language alone should not clear economics.
    const rec = ensureRecommendationConstraintConsistency(
      "### Recommendation\nDemand is verified strong. Scale up marketing.",
      c,
    );
    assert.equal(rec.repaired, true);
    assert.match(rec.message, /do not scale|economics remain negative/i);
  });

  it("7 final recommendation respects unresolved blocker", () => {
    const ask =
      "Synthetic analysis: unit economics are negative. Recommend next step and what demand verification unlocks.";
    const contract = parseExecutiveTaskContract(ask);
    assert.ok(contract.materialConstraints.some((c) => c.class === "NEGATIVE_UNIT_ECONOMICS"));
    const stub = synthesizeConstraintAwareRecommendation("next step", contract.materialConstraints);
    assert.match(stub, /do not scale/i);
    assert.doesNotMatch(stub, /scale up production and marketing/i);
  });

  it("8 decision-unlock respects dependency chain", () => {
    const repaired = ensureRecommendationConstraintConsistency(
      [
        "### Analysis",
        "Contribution margin is negative per completed sale.",
        "### What this verification unlocks",
        "Verifying sustainable demand would unlock scale up production and marketing efforts.",
      ].join("\n"),
      extractMaterialConstraints("contribution margin is negative per completed sale"),
    );
    assert.equal(repaired.repaired, true);
    assert.match(repaired.message, /demand is no longer the blocker|resolve unit economics/i);
    assert.doesNotMatch(repaired.message, /unlock scale up production/i);
  });

  it("9 reversal evidence changes recommendation correctly", () => {
    const active = extractMaterialConstraints("margin is negative");
    const superseded = applyConstraintSupersession(
      active,
      "Unit economics are now positive after verified cost reduction.",
    );
    const hit = recommendationViolatesConstraints(
      "Scale marketing carefully now that economics cleared.",
      superseded,
    );
    assert.equal(hit, null);
  });

  it("10 no unnecessary rigid decision template when unconstrained", () => {
    const c = extractMaterialConstraints("Synthetic: briefly recommend a bounded survey.");
    const stub = synthesizeConstraintAwareRecommendation("bounded survey", c);
    assert.match(stub, /bounded verification|carefully/i);
    assert.doesNotMatch(stub, /Do not scale production or marketing while contribution/i);
  });

  it("release path repairs contradictory scale recommendation", () => {
    const ask = [
      "Synthetic analysis only — not EmpireAI facts.",
      "Item M has negative contribution margin per completed sale.",
      "Supplier claims demand is strong.",
      "Recommend one next experiment and what demand verification would unlock.",
    ].join("\n");
    const draft = [
      "### Economics",
      "Item M loses money per completed sale — negative contribution margin.",
      "### Recommendation",
      "If sustainable demand is verified, scale up production and marketing efforts.",
    ].join("\n");
    const released = releaseExecutiveAnswer(draft, truth(), [], {
      userMessage: ask,
      taskContract: parseExecutiveTaskContract(ask),
    });
    assert.doesNotMatch(released.message, /scale up production and marketing/i);
    assert.match(released.message, /do not scale|economics|constraint/i);
  });

  it("appends constraint recommendation when economics present but omitted from answer", () => {
    const ask =
      "Synthetic: contribution margin = -S$4 per sale. Choose one next experiment and what demand verification unlocks.";
    const draft = [
      "1) Sales happened.",
      "2) Demand is interesting.",
      "3) Run a survey.",
    ].join("\n");
    const released = releaseExecutiveAnswer(draft, truth(), [], {
      userMessage: ask,
      taskContract: parseExecutiveTaskContract(ask),
    });
    assert.match(released.message, /do not scale|economics remain negative|resolve unit economics/i);
  });

  it("classify unlock/experiment parts as recommendation", () => {
    const ask = [
      "Synthetic analysis:",
      "4) Choose one next experiment.",
      "5) Choose one critical verification.",
      "6) Explain exactly what decision that verification unlocks.",
      "7) State reversal evidence.",
    ].join("\n");
    const c = parseExecutiveTaskContract(ask);
    const kinds = c.tasks.map((t) => t.kind);
    assert.ok(kinds.every((k) => k === "recommendation"), String(kinds));
  });

  it("synthesizeTaskUnitAnswer recommendation consumes materialConstraints", () => {
    const ask =
      "Synthetic: contribution margin is negative. What should we do next?";
    const contract = parseExecutiveTaskContract(ask);
    const task = contract.tasks.find((t) => t.kind === "recommendation") ?? contract.tasks[0]!;
    const out = synthesizeTaskUnitAnswer(task, truth(), {
      scopeType: contract.scopeType,
      materialConstraints: contract.materialConstraints,
    });
    assert.match(out, /do not scale|economics/i);
  });
});
