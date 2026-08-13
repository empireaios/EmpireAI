import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  enforceExecutiveTruthGrounding,
  failClosedExecutiveAnswer,
  releaseExecutiveAnswer,
  validateExecutiveDraft,
} from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function synthTruth(over: Partial<ExecutiveTruthSnapshot> = {}): ExecutiveTruthSnapshot {
  const asin = `B0SYN${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`.slice(0, 10);
  const base: ExecutiveTruthSnapshot = {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_release_gate",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: `opc_syn_${asin.slice(-4).toLowerCase()}`,
      asin,
      productName: "Synthetic Ceramic Desk Organizer Set",
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
      expectedProfitDisplay: "$2.00",
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
      gitCommitSha: "deadbeef0123456789abcdef",
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
      requiresGrandKing: ["Authorise Birth"],
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

function assertNoCorrectionAppendix(text: string) {
  assert.doesNotMatch(text, /\n---\n(?:Grounded corrections|Epistemic corrections)/i);
  assert.doesNotMatch(text, /^Correction:/im);
  assert.doesNotMatch(text, /^Actually:/im);
}

describe("executive release gate — Round A / Round-2", () => {
  it("blocks unattested retrieval without releasing invalid primary draft", () => {
    const truth = synthTruth();
    const draft =
      "I accessed the commerce tracking system and reviewed the commercial position report. EmpireAI posture is fully evidenced.";
    const out = releaseExecutiveAnswer(draft, truth, []);
    assert.equal(out.telemetry.draftValidationPass, false);
    assert.equal(out.telemetry.reconstructionAttempted, true);
    assert.ok(out.violations.includes("UNATTESTED_RETRIEVAL_CLAIM") || out.violations.includes("INVENTED_SOURCE_SYSTEM"));
    assert.doesNotMatch(out.message, /I accessed the commerce tracking system/i);
    assertNoCorrectionAppendix(out.message);
  });

  it("blocks unavailable capability claims", () => {
    const truth = synthTruth();
    const draft = "I retrieved the latest board from the project management tool.";
    const out = releaseExecutiveAnswer(draft, truth, []);
    assert.ok(out.violations.length > 0);
    assert.doesNotMatch(out.message, /I retrieved the latest board/i);
    assertNoCorrectionAppendix(out.message);
  });

  it("blocks invented plausible source labels", () => {
    const truth = synthTruth();
    const draft =
      "According to operational status reports and team communications, corridor readiness is confirmed.";
    const v = validateExecutiveDraft(draft, truth, []);
    assert.equal(v.ok, false);
    assert.ok(v.violations.includes("INVENTED_SOURCE_SYSTEM") || v.violations.includes("UNATTESTED_RETRIEVAL_CLAIM"));
    const out = releaseExecutiveAnswer(draft, truth, []);
    assert.doesNotMatch(out.message, /According to operational status reports/i);
    assertNoCorrectionAppendix(out.message);
  });

  it("current runtime beats historical offline claim in primary answer", () => {
    const truth = synthTruth();
    const draft =
      "EmpireAI is not yet running in production; production deployment remains pending.";
    const out = releaseExecutiveAnswer(draft, truth, []);
    assert.ok(out.violations.includes("STALE_OR_FALSE_PRODUCTION_OFFLINE_CLAIM"));
    assert.match(out.message, /answering live/i);
    assert.doesNotMatch(out.message, /not yet running in production/i);
    assertNoCorrectionAppendix(out.message);
  });

  it("detects internal contradiction and does not release it", () => {
    const truth = synthTruth();
    const draft =
      "I reviewed the internal discussions in the planning documents. I did not retrieve those documents and cannot substantiate access.";
    const out = releaseExecutiveAnswer(draft, truth, []);
    assert.ok(out.violations.includes("INTERNAL_CONTRADICTION") || out.violations.includes("UNATTESTED_RETRIEVAL_CLAIM"));
    assert.doesNotMatch(out.message, /I reviewed the internal discussions/i);
    assertNoCorrectionAppendix(out.message);
  });

  it("allows clean labeled inference", () => {
    const truth = synthTruth();
    const draft =
      "Inference only: given realised orders=0 in CURRENT_VERIFIED state, I infer we have not yet proven product-market fit. This is MODEL_INFERENCE, not a retrieved report.";
    const out = releaseExecutiveAnswer(draft, truth, []);
    assert.equal(out.telemetry.releasePath, "clean");
    assert.equal(out.message, draft);
  });

  it("allows clean UNKNOWN", () => {
    const truth = synthTruth();
    const draft =
      "I cannot currently verify broader operating narratives beyond CURRENT_VERIFIED runtime state. Provenance for external reports is UNKNOWN.";
    const out = releaseExecutiveAnswer(draft, truth, []);
    assert.equal(out.telemetry.releasePath, "clean");
  });

  it("allows valid attested runtime fact", () => {
    const truth = synthTruth();
    const draft = `CURRENT_VERIFIED: ASIN ${truth.product.asin} is the Synthetic Ceramic Desk Organizer Set. Realised orders are 0 — sales history is UNKNOWN. I cannot execute production deployment.`;
    const out = releaseExecutiveAnswer(draft, truth, []);
    assert.equal(out.telemetry.releasePath, "clean");
    assert.deepEqual(out.violations, []);
  });

  it("reconstruction succeeds without appendix leakage", () => {
    const truth = synthTruth();
    const draft =
      "I accessed the project management tool. EmpireAI is not serving the Grand King in a live production environment.";
    const out = releaseExecutiveAnswer(draft, truth, []);
    assert.equal(out.telemetry.reconstructionSucceeded, true);
    assert.equal(out.telemetry.failClosedUsed, false);
    assertNoCorrectionAppendix(out.message);
    assert.match(out.message, /CURRENT_VERIFIED|answering live/i);
  });

  it("fail-closed path is available and clean", () => {
    const truth = synthTruth();
    const closed = failClosedExecutiveAnswer(truth);
    const v = validateExecutiveDraft(closed, truth, []);
    assert.equal(v.ok, true);
    assert.match(closed, /cannot currently verify/i);
    assertNoCorrectionAppendix(closed);
  });

  it("compatibility enforcer never appends Epistemic corrections section", () => {
    const truth = synthTruth();
    const out = enforceExecutiveTruthGrounding(
      "According to the commercial position report I reviewed, last quarter sales declined. EmpireAI is not yet running in production.",
      truth,
      [],
    );
    assert.equal(out.adjusted, true);
    assertNoCorrectionAppendix(out.message);
    assert.ok(out.telemetry.reconstructionAttempted || out.telemetry.failClosedUsed);
  });
});
