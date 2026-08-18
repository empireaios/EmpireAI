import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildUsefulDegradedExecutiveAnswer,
  containsAskAgainFallback,
  countExecutiveTaskUnits,
  ensureUsefulTerminalChatMessage,
  resetPillowResponseReliabilityForTesting,
  recordPillowResponseAccepted,
  recordPillowResponseTerminal,
  getPillowResponseReliabilitySnapshot,
} from "../../orchestration/pillow-host/executive-response-completion.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function synthTruth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_resp",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_syn",
      asin: "B0SYNRESP01",
      productName: "Synthetic Response Widget",
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
      gitCommitSha: "abc123response",
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

describe("executive response completion", () => {
  it("never emits ask-again degraded text", () => {
    const msg = buildUsefulDegradedExecutiveAnswer({
      userMessage: "What should we do next?",
      truth: synthTruth(),
      reason: "llm_timeout",
    });
    assert.equal(containsAskAgainFallback(msg), false);
    assert.doesNotMatch(msg, /do not need to resubmit/i);
    assert.doesNotMatch(msg, /sit behind Grand King approval/i);
    assert.match(msg, /Synthetic Response Widget|live|verified|orders/i);
  });

  it("does not inject governance on evidence-only degraded path", () => {
    const msg = buildUsefulDegradedExecutiveAnswer({
      userMessage:
        "SyntheticCanaryEvidence: classify forecast vs realised; what does later ledger supersede?",
      truth: synthTruth(),
      reason: "visible_answer_gate",
      authorityConstrained: true,
    });
    assert.doesNotMatch(msg, /sit behind Grand King approval/i);
    assert.doesNotMatch(msg, /do not need to resubmit/i);
  });

  it("addresses multi-part structure without inventing sealed answers", () => {
    const multi = [
      "1) Current verified state?",
      "2) What is unknown?",
      "3) Recommendation?",
      "4) What would change your mind?",
      "5) Next verification?",
    ].join("\n");
    assert.ok(countExecutiveTaskUnits(multi) >= 5);
    const msg = buildUsefulDegradedExecutiveAnswer({
      userMessage: multi,
      truth: synthTruth(),
    });
    assert.match(msg, /multi-part|task units|1\)|verified state|orders/i);
    assert.equal(containsAskAgainFallback(msg), false);
  });

  it("rewrites constitutional ask-again drafts into useful terminals", () => {
    const sealed = ensureUsefulTerminalChatMessage({
      draft:
        "Constitutional gate: Pillow could not complete a Digital Soul–gated executive response. No ungated fallback answer is permitted. Please retry when the executive pipeline is healthy.",
      userMessage: "Summarise current commerce posture.",
      truth: synthTruth(),
    });
    assert.equal(sealed.degradedUsed, true);
    assert.equal(containsAskAgainFallback(sealed.message), false);
    assert.doesNotMatch(sealed.message, /Constitutional gate/i);
  });

  it("records reliability telemetry without user resubmission", () => {
    resetPillowResponseReliabilityForTesting();
    recordPillowResponseAccepted("req_1");
    recordPillowResponseTerminal({
      requestId: "req_1",
      kind: "degraded_useful",
      useful: true,
      degradedUsed: true,
      retryUsed: true,
      latencyMs: 120,
      askAgainFallback: false,
      userResubmissionRequired: false,
    });
    const snap = getPillowResponseReliabilitySnapshot();
    assert.equal(snap.acceptedRequests, 1);
    assert.equal(snap.completedRequests, 1);
    assert.equal(snap.degradedCompletedRequests, 1);
    assert.equal(snap.userResubmissionRequired, 0);
    assert.equal(snap.askAgainFallbacks, 0);
  });
});
