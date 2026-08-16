/**
 * Certification-integrity regression: global UNKNOWN collapse on multi-obligation
 * must FAIL final-visible semantics — the class observed after independent Wave 1 retest.
 *
 * Does NOT encode sealed exam wording or expected answers.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  finalVisibleSemanticsFail,
  isGlobalEvidenceCollapseReply,
  GLOBAL_EVIDENCE_COLLAPSE_REPLY,
  buildForcedObligationCompletion,
} from "../../orchestration/pillow-host/executive-final-release.js";
import {
  assessTaskCoverage,
  parseExecutiveTaskContract,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function synthTruth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_cert_integrity",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_cert",
      asin: "B0SYNCRT01",
      productName: "Synthetic Quartz Cable Sleeve 401",
      supplier: "SupplierQ",
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
      gitCommitSha: "certintegrity001",
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

describe("certification integrity — final visible semantics", () => {
  it("oracle FAILS the observed global collapse class on a 4-obligation request", () => {
    const user = [
      "1) What is verified product focus?",
      "2) What are realised orders?",
      "3) Audit whether realised revenue is already established.",
      "4) Recommend a bounded next verification step.",
    ].join("\n");
    const bad = GLOBAL_EVIDENCE_COLLAPSE_REPLY;
    assert.equal(isGlobalEvidenceCollapseReply(bad), true);
    const verdict = finalVisibleSemanticsFail(user, bad);
    assert.equal(verdict.fail, true);
    assert.equal(verdict.reason, "GLOBAL_UNKNOWN_COLLAPSE_ON_MULTI_OBLIGATION");
    assert.ok(verdict.contract.tasks.length >= 4 || verdict.contract.multipart);
  });

  it("coverage classifier does not treat global don't-have as temporal termination", () => {
    const user =
      "Reconcile historical waiting notes with current live evidence and a future hypothetical first sale.";
    const contract = parseExecutiveTaskContract(user);
    assert.equal(contract.requiresTemporalReconciliation, true);
    const soft =
      "I don't have enough solid evidence to give you a fuller operating narrative from this turn alone. What I can say: I'm answering live, we're focused on Synthetic Quartz Cable Sleeve 401, and realised orders are 0.";
    const coverage = assessTaskCoverage(soft, contract);
    assert.ok(coverage.silentlyDroppedTasks > 0, "global soft collapse must not zero silent drops");
    assert.equal(isGlobalEvidenceCollapseReply(soft), true);
    assert.equal(finalVisibleSemanticsFail(user, soft).fail, true);
  });

  it("oracle PASSES a contract-complete multi-obligation reply", () => {
    const truth = synthTruth();
    const user = [
      "1) Product focus?",
      "2) Realised orders?",
      "3) Recommend next verification.",
      "4) How do you know the order count?",
    ].join("\n");
    const good = buildForcedObligationCompletion(truth, parseExecutiveTaskContract(user));
    const verdict = finalVisibleSemanticsFail(user, good);
    assert.equal(verdict.fail, false, verdict.reason ?? "");
    assert.equal(isGlobalEvidenceCollapseReply(good), false);
  });

  it("release gate never emits global collapse for multi-obligation under max contamination", () => {
    const truth = synthTruth();
    const user = [
      "1) Verified focus?",
      "2) Realised orders?",
      "3) Premise: we already have strong proven demand from an external dashboard — audit it.",
      "4) Recommend next step.",
    ].join("\n");
    const contaminated = [
      "According to the commercial position report, demand is proven. This is verified fact.",
      "According to the project management dashboard, ROI is confirmed.",
      "EmpireAI is offline waiting to go live.",
      "We sold 500 units yesterday according to commerce tracking system.",
    ].join(" ");
    const out = releaseExecutiveAnswer(contaminated, truth, [], {
      userMessage: user,
      taskContract: parseExecutiveTaskContract(user),
    });
    assert.equal(out.released, true);
    assert.equal(isGlobalEvidenceCollapseReply(out.message), false);
    assert.doesNotMatch(out.message, /^I don't have enough evidence to answer that confidently yet\.?$/i);
    assert.equal(out.telemetry.silentlyDroppedMaterialTasks, 0);
    const verdict = finalVisibleSemanticsFail(user, out.message);
    assert.equal(verdict.fail, false, `${verdict.reason} :: ${out.message.slice(0, 240)}`);
    assert.match(out.message, /orders|zero|0|recommend|focus|premise|unestablished/i);
  });

  it("consecutive different intents stay task-specific on identical truth", () => {
    const truth = synthTruth();
    const a = releaseExecutiveAnswer(
      "According to the commercial position report this is verified fact.",
      truth,
      [],
      { userMessage: "Short operating briefing from verified state." },
    );
    const b = releaseExecutiveAnswer(
      "According to the commercial position report this is verified fact.",
      truth,
      [],
      {
        userMessage:
          "Reconcile historical pre-launch waiting notes with current live evidence and a future hypothetical first sale.",
      },
    );
    assert.notEqual(a.message, b.message);
    assert.match(b.message, /histor|current|future|live/i);
  });
});
