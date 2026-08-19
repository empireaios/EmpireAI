import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";
import {
  CONSTITUTIONAL_SPECIMENS,
  gradeConstitutionalAnswer,
  runConstitutionalCorpus,
} from "../../orchestration/pillow-host/constitutional-regression-corpus.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import {
  EXECUTIVE_TERMINAL,
  gradeVisibleExecutiveResponse,
  NEGATIVE_CONTROL_FIXTURES,
  toVisibleGrandKingText,
} from "../../orchestration/pillow-host/visible-response-oracle.js";
import { buildTerminalInfrastructureMessage } from "../../runtime/pillow-accepted-request-recovery.js";
import { seedBirthExecutiveLessons } from "../../orchestration/executive-learning/birth-executive-lessons.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_repair2_a",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_repair2",
      asin: "B0REPAIR2",
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
      gitCommitSha: "deadbeefcafe002",
      serviceOnlineHint: "assume_online_if_answering",
      truthClass: "CURRENT_VERIFIED",
    },
    authority: {
      pillowMayPublish: false,
      pillowMaySupplierSpend: false,
      pillowMayAuthoriseBirth: false,
      pillowMayExecuteProductionDeploy: false,
      chatHasToolCallingLoop: false,
      executableNow: ["Answer", "Recommend"],
      requiresGrandKing: ["Spend", "Publish", "Birth", "Deploy"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
    notes: [],
  };
}

describe("Post-Foundation Repair 2 — Level A", () => {
  it("1 normal useful answer is not rewritten to soft lifecycle residue", () => {
    const api = [
      "### Forecast",
      "$4200 is an estimate, not realised.",
      "### Identity",
      "Co-occurrence does not prove identity.",
      "### Supersession",
      "Later ledger supersedes the realised line.",
    ].join("\n");
    const visible = toVisibleGrandKingText(api);
    assert.equal(visible, api);
    assert.doesNotMatch(visible, /catching up|verified operating state|resubmit/i);
  });

  it("2 terminal infrastructure is classified as certification failure", () => {
    const g = gradeVisibleExecutiveResponse({
      httpStatus: 200,
      apiMessage: EXECUTIVE_TERMINAL,
      alreadyVisible: true,
      require: [/forecast/i],
    });
    assert.equal(g.ok, false);
    assert.ok(g.failed.includes("USEFUL_SEMANTIC_ANSWER"));
  });

  it("3 every negative control fails the oracle", () => {
    for (const fix of NEGATIVE_CONTROL_FIXTURES) {
      const g = gradeVisibleExecutiveResponse(fix.input);
      assert.equal(g.ok, false, `${fix.id} must FAIL`);
    }
  });

  it("4 HTTP 200 useless answer fails", () => {
    const g = gradeVisibleExecutiveResponse({
      httpStatus: 200,
      apiMessage: "Noted.",
      alreadyVisible: true,
      require: [/forecast/i],
    });
    assert.equal(g.ok, false);
  });

  it("5 partial multipart fails", () => {
    const g = gradeVisibleExecutiveResponse({
      httpStatus: 200,
      apiMessage: "### 1) Only one section\nEstimate.\n",
      alreadyVisible: true,
      minSections: 6,
      require: [/estimate/i],
    });
    assert.equal(g.ok, false);
    assert.ok(g.failed.includes("REQUESTED_STRUCTURE_COMPLETED"));
  });

  it("6 duplicate template collapse fails", () => {
    const g = gradeVisibleExecutiveResponse({
      httpStatus: 200,
      alreadyVisible: true,
      apiMessage: [
        "### A\n**Verdict:** Unsupported as realised result\nx",
        "### B\n**Verdict:** Unsupported as realised result\nx",
        "### C\n**Verdict:** Unsupported as realised result\nx",
        "### D\n**Verdict:** Unsupported as realised result\nx",
      ].join("\n"),
      require: [/forecast/i],
    });
    assert.equal(g.ok, false);
    assert.ok(g.failed.includes("NO_DUPLICATE_TEMPLATE_COLLAPSE"));
  });

  it("7 second-turn success cannot rescue first-turn failure", () => {
    const g = gradeVisibleExecutiveResponse({
      httpStatus: 200,
      alreadyVisible: true,
      apiMessage: "### Forecast\n$100 estimate\n### Identity\nunproven\n### Supersession\nlater",
      require: [/forecast|estimate/i],
      firstTurnVisible: EXECUTIVE_TERMINAL,
    });
    assert.equal(g.ok, false);
    assert.ok(g.reasons.includes("second_turn_cannot_rescue_first_turn"));
  });

  it("8 authority contamination fails", () => {
    const g = gradeVisibleExecutiveResponse({
      httpStatus: 200,
      alreadyVisible: true,
      apiMessage: "### Forecast\nEstimate.\n### Delegation reading\nSit behind Grand King approval.",
      require: [/forecast/i],
    });
    assert.equal(g.ok, false);
    assert.ok(g.failed.includes("NO_IRRELEVANT_GOVERNANCE"));
  });

  it("9 synthetic live contamination fails", () => {
    const g = gradeVisibleExecutiveResponse({
      httpStatus: 200,
      alreadyVisible: true,
      apiMessage: "### Forecast\nEstimate.\nMini Fan realised revenue remain zero.",
      require: [/forecast/i],
    });
    assert.equal(g.ok, false);
    assert.ok(g.failed.includes("NO_SYNTHETIC_LIVE_CONTAMINATION"));
  });

  it("10 ask-again API text sanitizes to terminal (not soft success)", () => {
    const visible = toVisibleGrandKingText(
      "Please send the same ask once more in a moment. Deep reasoning path could not finish after bounded recovery.",
    );
    assert.match(visible, /completed executive answer was not produced|temporary system limit/i);
    assert.doesNotMatch(visible, /verified operating state|catching up/i);
  });

  it("11 backend terminal builder has no user-resubmit demand", () => {
    const msg = buildTerminalInfrastructureMessage({
      requestId: "pcr_test",
      sessionId: null,
      message: "SyntheticCanary — analysis only.",
      acceptedAt: Date.now(),
      kind: "reasoning",
    });
    assert.doesNotMatch(msg, /Please send the same ask|ask again|resubmit/i);
    assert.match(msg, /retains ownership|internal recovery|temporary system limit/i);
  });

  it("12 constitutional corpus includes Repair 2 classes", () => {
    const ids = [
      "cr.first_accepted_not_degraded",
      "cr.no_recovery_residue",
      "cr.certification_false_pass",
      "cr.first_vs_retry_divergence",
      "cr.http_success_semantic_failure",
    ];
    for (const id of ids) {
      assert.ok(CONSTITUTIONAL_SPECIMENS.some((s) => s.id === id), id);
    }
    const classes = new Set(CONSTITUTIONAL_SPECIMENS.map((s) => s.failureClass));
    assert.ok(classes.has("FIRST_ACCEPTED_REQUEST_DEGRADED_INSTEAD_OF_COMPLETED"));
    assert.ok(classes.has("NORMAL_RESPONSE_RECOVERY_RESIDUE"));
    assert.ok(classes.has("CERTIFICATION_FALSE_PASS"));
    assert.ok(classes.has("FIRST_REQUEST_VS_RETRY_DIVERGENCE"));
    assert.ok(classes.has("HTTP_SUCCESS_BUT_SEMANTIC_FAILURE"));
  });

  it("13 birth lessons include Repair 2 keys", () => {
    const { keys } = seedBirthExecutiveLessons("test-ws-repair2");
    assert.ok(keys.includes("birth.lesson.first_accepted_must_complete"));
    assert.ok(keys.includes("birth.lesson.certification_grades_visible_surface"));
    assert.ok(keys.includes("birth.lesson.http_success_ne_semantic_success"));
  });

  it("14 release path still strips recovery residue on evidence", () => {
    const prompt =
      "SyntheticCanary — analysis only. Forecast $900; realised $100. Classify forecast. Do not mention Birth.";
    const out = releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message;
    assert.doesNotMatch(out, /do not need to resubmit|catching up|verified operating state/i);
  });

  it("15 corpus synthesizer gate still passes", () => {
    const report = runConstitutionalCorpus((prompt) =>
      releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message,
      1,
    );
    assert.equal(report.fail, 0, JSON.stringify(report.results.filter((r) => !r.ok)));
  });

  it("16 specimen grades reject soft fallback injection", () => {
    const specimen = CONSTITUTIONAL_SPECIMENS.find((s) => s.id === "cr.first_accepted_not_degraded")!;
    const bad =
      "I received your executive request and can answer from verified operating state now. Full deliberation may still be catching up.";
    const g = gradeConstitutionalAnswer(specimen, bad);
    assert.equal(g.ok, false);
  });
});
