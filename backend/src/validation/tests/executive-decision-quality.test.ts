import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessDecisionQuality,
  classifyDecisionPosture,
  repairDecisionQualityAnswer,
} from "../../orchestration/pillow-host/executive-decision-quality.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";
import { assessConversationalUx } from "../../orchestration/pillow-host/executive-conversation-surface.js";

function synthTruth(over: Partial<ExecutiveTruthSnapshot> = {}): ExecutiveTruthSnapshot {
  const base: ExecutiveTruthSnapshot = {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_decision",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_syn_dec",
      asin: "B0SYNDEC01",
      productName: "Synthetic Desk Widget Pro",
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
      gitCommitSha: "abc123decision",
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

describe("executive decision quality — Round A", () => {
  it("flags verified goal → specific launch without material bridge", () => {
    const truth = synthTruth();
    const draft =
      "We have zero realised sales. I recommend we launch Synthetic Desk Widget Pro immediately as the best next action.";
    const a = assessDecisionQuality(draft, truth);
    assert.ok(
      a.violations.includes("GOAL_SOLUTION_CAUSAL_LEAP") ||
        a.violations.includes("UNVERIFIED_SOLUTION_FROM_VERIFIED_GOAL"),
    );
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "What should we do next?",
    });
    assert.doesNotMatch(out.message, /launch Synthetic Desk Widget Pro immediately/i);
    assert.match(out.message, /verify|bounded test|depends/i);
    assert.doesNotMatch(out.message, /\bACT_NOW\b|\bVERIFY_THEN_ACT\b|\bDECISION_CRITICAL\b/);
    assert.equal(assessConversationalUx(out.message).ok, true);
  });

  it("allows verify-then-act when material unknown is acknowledged", () => {
    const truth = synthTruth();
    const draft =
      "Realised sales are zero so we need progress. Demand and unit economics for this candidate are unverified. I recommend verifying those first before we launch; if they clear the threshold, proceed with a bounded test.";
    const a = assessDecisionQuality(draft, truth);
    assert.equal(a.violations.length, 0);
    assert.equal(classifyDecisionPosture(draft), "VERIFY_THEN_ACT");
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "What should we do?",
    });
    assert.equal(out.telemetry.releasePath, "clean");
    assert.match(out.message, /verifying|verify/i);
  });

  it("allows reversible act-now despite incomplete demand evidence", () => {
    const truth = synthTruth();
    const draft =
      "Demand evidence is incomplete. Still, a cheap reversible bounded test has low downside and waiting may cost more. I recommend a bounded pilot now while we continue learning.";
    const a = assessDecisionQuality(draft, truth);
    assert.equal(a.violations.length, 0);
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "Should we move despite uncertainty?",
    });
    assert.equal(out.telemetry.releasePath, "clean");
    assert.match(out.message, /bounded|reversible|pilot/i);
  });

  it("allows conditional action framing", () => {
    const truth = synthTruth();
    const draft =
      "I recommend we launch only if unit economics clear a contribution-margin threshold and listing readiness is confirmed.";
    const a = assessDecisionQuality(draft, truth);
    assert.equal(a.violations.length, 0);
    assert.equal(classifyDecisionPosture(draft), "ACT_CONDITIONALLY");
  });

  it("flags material assumption treated as established", () => {
    const truth = synthTruth();
    const draft =
      "A key assumption is that market demand for this candidate is strong, which we have not verified. Therefore I recommend we launch it immediately.";
    const a = assessDecisionQuality(draft, truth);
    assert.ok(
      a.violations.includes("MATERIAL_ASSUMPTION_TREATED_AS_ESTABLISHED") ||
        a.violations.includes("UNVERIFIED_SOLUTION_FROM_VERIFIED_GOAL") ||
        a.violations.includes("GOAL_SOLUTION_CAUSAL_LEAP"),
    );
  });

  it("immaterial uncertainty does not block progress recommendation", () => {
    const truth = synthTruth();
    const draft =
      "We have zero realised sales. I don't know the exact shade of the packaging yet, but that should not block prioritising commercial progress toward a first transaction.";
    const a = assessDecisionQuality(draft, truth);
    assert.equal(a.violations.length, 0);
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "What matters right now?",
    });
    assert.equal(out.telemetry.releasePath, "clean");
  });

  it("latency→migration leap blocked without bridge", () => {
    const truth = synthTruth({
      financial: {
        orders: 5,
        realisedRevenueUsd: 120,
        buyableListings: 1,
        publishedListings: 1,
        expectedProfitDisplay: null,
        expectedProfitTruthClass: "UNKNOWN",
        realisedTruthClass: "CURRENT_VERIFIED",
      },
    });
    const draft =
      "Latency is high. I recommend we migrate the database immediately to fix it.";
    const a = assessDecisionQuality(draft, truth);
    assert.ok(a.violations.includes("GOAL_SOLUTION_CAUSAL_LEAP"));
  });

  it("churn→discount leap blocked; verify-first allowed", () => {
    const truth = synthTruth({
      financial: {
        orders: 20,
        realisedRevenueUsd: 900,
        buyableListings: 1,
        publishedListings: 1,
        expectedProfitDisplay: null,
        expectedProfitTruthClass: "UNKNOWN",
        realisedTruthClass: "CURRENT_VERIFIED",
      },
    });
    const bad =
      "Customer churn is high. Therefore I recommend we increase ad spend immediately.";
    assert.ok(assessDecisionQuality(bad, truth).violations.includes("GOAL_SOLUTION_CAUSAL_LEAP"));
    const good =
      "Churn is high. Before we increase ad spend, I recommend verifying whether the issue is offer quality versus acquisition quality first.";
    assert.equal(assessDecisionQuality(good, truth).violations.length, 0);
  });

  it("decision repair output stays natural and valid", () => {
    const truth = synthTruth();
    const draft =
      "Zero revenue. Launch the candidate now — demand is an assumption we have not verified but we should proceed anyway.";
    const a = assessDecisionQuality(draft, truth);
    const repaired = repairDecisionQualityAnswer(draft, truth, a);
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "Recommend the next move.",
    });
    assert.equal(assessDecisionQuality(repaired, truth).violations.length, 0);
    assert.equal(out.telemetry.finalRevalidationPass, true);
    assert.doesNotMatch(out.message, /\bACT_NOW\b|\bVERIFY_THEN_ACT\b/);
    assert.equal(assessConversationalUx(out.message).ok, true);
  });
});
