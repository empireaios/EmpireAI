/**
 * Post-Foundation Repair 4 — Level A:
 * claim enumeration completeness, cross-section ledger, domain-native memory.
 */
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
  extractExplicitClaimSet,
  parseExecutiveTaskContract,
  assessTaskCoverage,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import {
  assessClaimEnumeration,
  buildConclusionLedger,
  detectMaterialInternalContradictions,
  enforceClaimEnumeration,
  parseClaimObligationsFromContractTasks,
} from "../../orchestration/pillow-host/executive-conclusion-ledger.js";
import {
  isSourceDomainLanguageLeak,
  repairHistoricalOccurrenceErasure,
} from "../../orchestration/pillow-host/executive-event-state.js";
import {
  isLessonDoctrineDump,
  realizeDomainNativeMemorySurface,
} from "../../orchestration/pillow-host/executive-memory-realization.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";
import { seedBirthExecutiveLessons } from "../../orchestration/executive-learning/birth-executive-lessons.js";
import { detectExpectedTopLevelSections } from "../../orchestration/pillow-host/executive-section-contract.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_repair4_a",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_repair4",
      asin: "B0REPAIR4",
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
      gitCommitSha: "deadbeefcafe004",
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

function fiveClaimAsk(): string {
  return [
    "SyntheticCanaryR4 — analysis only. Provide a separate verdict on each of the five quoted claims in original order.",
    `1. "Forecast revenue reaches $4000."`,
    `2. "Later realised ledger shows $500."`,
    `3. "HT-88 is Harbour Crown Hotel."`,
    `4. "Independent rating +12% outweighs supplier."`,
    `5. "The completed stay never historically occurred because of a later refund."`,
  ].join("\n");
}

describe("Post-Foundation Repair 4 — Level A", () => {
  it("1 five claims → exactly five verdicts", () => {
    const ask = fiveClaimAsk();
    assert.equal(extractExplicitClaimSet(ask).length, 5);
    const c = parseExecutiveTaskContract(ask);
    assert.equal(c.expectedClaims, 5);
    const claims = parseClaimObligationsFromContractTasks(c.tasks);
    assert.equal(claims.length, 5);
    const partial = [
      "### Claim 1\n**Verdict:** Unproven\n",
      "### Claim 3\n**Verdict:** Contradicted\n",
      "### Claim 4\n**Verdict:** Unproven\n",
      "### Claim 5\n**Verdict:** Contradicted\n",
    ].join("\n");
    const fixed = enforceClaimEnumeration(partial, claims, { domainHint: "hospitality" });
    const report = assessClaimEnumeration(fixed.message, claims);
    assert.equal(report.expected, 5);
    assert.equal(report.rendered, 5);
    assert.equal(report.missing.length, 0);
    assert.equal(report.duplicate.length, 0);
    assert.match(fixed.message, /Claim\s*2/i);
  });

  it("2 middle claim cannot disappear even if finances solved earlier", () => {
    const ask = fiveClaimAsk();
    const c = parseExecutiveTaskContract(ask);
    const claims = parseClaimObligationsFromContractTasks(c.tasks);
    const body = [
      "Forecast $4000 is an estimate; later realised ledger shows $500 — forecast ≠ realised.",
      "### Claim 1",
      "**Verdict:** Unproven",
      '"Forecast revenue reaches $4000."',
      "### Claim 3",
      "**Verdict:** Unproven",
      "### Claim 4",
      "**Verdict:** Unproven",
      "### Claim 5",
      "**Verdict:** Unproven",
    ].join("\n");
    const cov = assessTaskCoverage(body, c);
    assert.ok(
      cov.byTask.some((t) => t.id === "claim_2" && t.status === "silent_drop"),
      JSON.stringify(cov.byTask),
    );
    const polished = polishFinalVisibleAnswer(body, ask, c);
    const report = assessClaimEnumeration(polished, claims);
    assert.equal(report.missing.length, 0, polished);
    assert.match(polished, /Claim\s*2/i);
  });

  it("3 original claim order preserved", () => {
    const ask = fiveClaimAsk();
    const claims = parseClaimObligationsFromContractTasks(parseExecutiveTaskContract(ask).tasks);
    const scrambled = [
      "### Claim 5\n**Verdict:** Unproven\n",
      "### Claim 1\n**Verdict:** Unproven\n",
      "### Claim 4\n**Verdict:** Unproven\n",
      "### Claim 3\n**Verdict:** Unproven\n",
      "### Claim 2\n**Verdict:** Unproven\n",
    ].join("\n");
    const fixed = enforceClaimEnumeration(scrambled, claims).message;
    const idxs = [...fixed.matchAll(/Claim\s*(\d+)/gi)].map((m) => Number(m[1]));
    const firstFive = idxs.slice(0, 5);
    assert.deepEqual(firstFive, [1, 2, 3, 4, 5], JSON.stringify(idxs));
  });

  it("4 earlier entity conclusion reused — identity claim contradicted", () => {
    const ask = [
      "Synthetic hotel analysis. Provide a separate verdict on each of the quoted claims.",
      `1. "HT-88 is Harbour Crown Hotel."`,
      `2. "Forecast equals realised."`,
    ].join("\n");
    const claims = parseClaimObligationsFromContractTasks(parseExecutiveTaskContract(ask).tasks);
    const answer = [
      "Property registry: HT-88 is Hillside Transit Hotel. Harbour Crown Hotel is HC-11.",
      "Therefore HT-88 and Harbour Crown Hotel are distinct entities.",
      "### Claim 1",
      "**Verdict:** Supported",
      '"HT-88 is Harbour Crown Hotel."',
      "Confirmed by the property registry.",
      "### Claim 2",
      "**Verdict:** Unproven",
    ].join("\n");
    const ledger = buildConclusionLedger(answer);
    assert.ok(ledger.some((e) => /hillside/i.test(e.value)), JSON.stringify(ledger));
    const fixed = enforceClaimEnumeration(answer, claims).message;
    assert.match(fixed, /Claim\s*1[\s\S]*?\*\*Verdict:\*\*\s*Contradicted/i);
    assert.equal(detectMaterialInternalContradictions(fixed).length, 0, fixed);
  });

  it("5 earlier financial conclusion reused", () => {
    const ask = [
      "Synthetic — verdict each quoted claim.",
      `1. "Forecast revenue is realised."`,
      `2. "Supplier claim stands."`,
    ].join("\n");
    const claims = parseClaimObligationsFromContractTasks(parseExecutiveTaskContract(ask).tasks);
    const answer = [
      "Forecast $2000 versus realised $300 — forecast is not realised.",
      "### Claim 1",
      "**Verdict:** Supported",
      '"Forecast revenue is realised."',
      "### Claim 2",
      "**Verdict:** Unproven",
    ].join("\n");
    const fixed = enforceClaimEnumeration(answer, claims).message;
    assert.match(fixed, /Claim\s*1[\s\S]*?\*\*Verdict:\*\*\s*Contradicted/i);
  });

  it("6 earlier temporal conclusion reused", () => {
    const ask = [
      "Synthetic hospitality — verdict each quoted claim.",
      `1. "The completed stay never historically occurred because of a later refund."`,
      `2. "Room-nights equal unique guests."`,
    ].join("\n");
    const claims = parseClaimObligationsFromContractTasks(parseExecutiveTaskContract(ask).tasks);
    const answer = [
      "The stay historically occurred; a later refund changes economic treatment only.",
      "### Claim 1",
      "**Verdict:** Supported",
      '"The completed stay never historically occurred because of a later refund."',
      "### Claim 2",
      "**Verdict:** Unproven",
    ].join("\n");
    const fixed = enforceClaimEnumeration(answer, claims).message;
    assert.match(fixed, /Claim\s*1[\s\S]*?\*\*Verdict:\*\*\s*Contradicted/i);
  });

  it("7 deliberately conflicting later verdict is caught", () => {
    const answer = [
      "HT-88 is Hillside Transit Hotel.",
      "### Claim 1",
      "**Verdict:** Supported",
      '"HT-88 is Harbour Crown Hotel."',
    ].join("\n");
    const issues = detectMaterialInternalContradictions(answer);
    assert.ok(issues.length >= 1, JSON.stringify(issues));
  });

  it("8 one unknown claim remains explicitly present", () => {
    const ask = fiveClaimAsk();
    const claims = parseClaimObligationsFromContractTasks(parseExecutiveTaskContract(ask).tasks);
    const body = [
      "### Claim 1\n**Verdict:** Unproven\n",
      "### Claim 3\n**Verdict:** Unproven\n",
      "### Claim 4\n**Verdict:** Unproven\n",
      "### Claim 5\n**Verdict:** Unproven\n",
    ].join("\n");
    const fixed = enforceClaimEnumeration(body, claims).message;
    assert.match(fixed, /Claim\s*2[\s\S]*?(Unknown|Unproven|not established)/i);
  });

  it("9 repeated proposition not regenerated inconsistently", () => {
    const ask = [
      "Synthetic — verdict each claim.",
      `1. "HT-88 is Harbour Crown Hotel."`,
      `2. "HT-88 is Harbour Crown Hotel."`,
    ].join("\n");
    // Same proposition twice — both must follow ledger.
    const claims = parseClaimObligationsFromContractTasks(parseExecutiveTaskContract(ask).tasks);
    const answer = [
      "HT-88 is Hillside Transit Hotel.",
      "### Claim 1\n**Verdict:** Supported\n",
      "### Claim 2\n**Verdict:** Supported\n",
    ].join("\n");
    const fixed = enforceClaimEnumeration(answer, claims).message;
    const supports = (fixed.match(/\*\*Verdict:\*\*\s*Supported/gi) || []).length;
    assert.equal(supports, 0, fixed);
  });

  it("10 synthetic hotel scenario contains no realised-orders language", () => {
    const ask =
      "SyntheticCanaryHotel — hospitality analysis only. Room-nights vs guests; forecast vs realised occupancy. Do not mention EmpireAI products or Birth.";
    const dirty = [
      "Occupancy forecast is not realised.",
      "I don't have verified sales-history evidence beyond realised orders.",
      "**Event-state reading:** A later refund, return, chargeback, compensation, SLA breach...",
    ].join("\n");
    const out = polishFinalVisibleAnswer(dirty, ask);
    assert.equal(isSourceDomainLanguageLeak(out), false, out);
    assert.doesNotMatch(out, /realised orders|sales-history evidence|\*\*Event-state reading:\*\*/i);
  });

  it("11 synthetic healthcare scenario contains no commerce-source language", () => {
    const ask =
      "SyntheticCanaryClinic — healthcare analysis only. Forecast patient volume vs realised visits.";
    const dirty =
      "Forecast visits are estimates. I don't have verified sales-history evidence beyond realised orders.";
    const out = realizeDomainNativeMemorySurface(dirty, ask, true).message;
    assert.doesNotMatch(out, /sales-history|realised orders/i);
  });

  it("12 retrieved lesson affects reasoning without surfacing lesson text", () => {
    const ask =
      "Synthetic hotel: stays completed; later refund after service breach. Did stays historically occur?";
    const dumped =
      "Refunds mean the stays should not be counted as historically completed.\n\n**Event-state reading:** A later refund, return, chargeback, compensation, SLA breach does not erase occurrence.";
    const repaired = repairHistoricalOccurrenceErasure(dumped, ask);
    const realized = realizeDomainNativeMemorySurface(repaired.message, ask, true);
    assert.equal(isLessonDoctrineDump(realized.message), false, realized.message);
    assert.match(realized.message, /does not by itself|historically occurred|economic treatment/i);
    assert.equal(realized.telemetry.LESSON_TEXT_SURFACED, false);
  });

  it("13 exact section contract preserved", () => {
    assert.equal(
      detectExpectedTopLevelSections("Answer in exactly 6 numbered sections."),
      6,
    );
    const ask = [
      "SyntheticCanaryR4Secs — analysis only. Answer in exactly 6 numbered sections.",
      "Cover: unknowns, forecast vs realised, identity, provenance, supersession, synthesis.",
    ].join("\n");
    const out = polishFinalVisibleAnswer(
      releaseExecutiveAnswer("", truth(), [], { userMessage: ask }).message,
      ask,
    );
    const markers = [...out.matchAll(/^\s*(\d{1,2})[.)]\s+\S/gm)].map((m) => Number(m[1]));
    const dups = markers.filter((n, i) => markers.indexOf(n) !== i);
    assert.equal(dups.length, 0, JSON.stringify(markers));
  });

  it("14 long multipart mixed request still completes claims", () => {
    const ask = [
      "SyntheticCanaryR4Long — analysis only. Do not mention Birth or Mini Fan.",
      "1) Reconcile forecast $2800 vs realised $420.",
      "2) Classify HT-88 vs Harbour Crown using registry: HT-88=Hillside Transit; HC-11=Harbour Crown.",
      "3) Provide a separate verdict on each of the five quoted claims in original order:",
      `1. "Forecast equals realised."`,
      `2. "Realised ledger is $420."`,
      `3. "HT-88 is Harbour Crown Hotel."`,
      `4. "Independent +17% outweighs supplier."`,
      `5. "Refund means the stay never occurred."`,
      "4) What remains unknown?",
    ].join("\n");
    const c = parseExecutiveTaskContract(ask);
    assert.ok(c.expectedClaims >= 5);
    const draft = releaseExecutiveAnswer("", truth(), [], { userMessage: ask }).message;
    const out = polishFinalVisibleAnswer(draft, ask, c);
    const claims = parseClaimObligationsFromContractTasks(c.tasks);
    const report = assessClaimEnumeration(out, claims);
    assert.equal(report.missing.length, 0, out.slice(0, 800));
    assert.doesNotMatch(out, /sales-history evidence beyond realised orders/i);
  });

  it("14b claim-audit phrasing under exact section contract still fills claims", () => {
    const ask = [
      "SyntheticCanaryR4Audit — analysis only. Answer in exactly 6 numbered sections.",
      "Cover forecast vs realised; identity; occurrence; then claim audit of:",
      `1. "HT-77 is Harbour Crown Hotel."`,
      `2. "Forecast equals realised."`,
      `3. "The stay never historically occurred because of the refund."`,
      "Then unknowns and synthesis.",
    ].join("\n");
    const c = parseExecutiveTaskContract(ask);
    assert.equal(c.expectedClaims, 3, JSON.stringify(extractExplicitClaimSet(ask)));
    assert.equal(c.expectedTopLevelSections, 6);
    const draft = [
      "1. Forecast not realised.",
      "2. HT-77 is Cedar Transit Lodge.",
      "3. Stay historically occurred.",
      "4. Audit deferred.",
      "5. Unknowns open.",
      "6. Synthesis stable.",
    ].join("\n");
    const out = polishFinalVisibleAnswer(draft, ask, c);
    const claims = parseClaimObligationsFromContractTasks(c.tasks);
    assert.equal(assessClaimEnumeration(out, claims).missing.length, 0, out);
    assert.match(out, /Claim\s*1/i);
    assert.match(out, /Claim\s*2/i);
    assert.match(out, /Claim\s*3/i);
  });

  it("15 constitutional classes + birth lessons present", () => {
    const classes = new Set(CONSTITUTIONAL_SPECIMENS.map((s) => s.failureClass));
    for (const fc of [
      "EXPLICIT_MIDDLE_CLAIM_DROPPED",
      "LATER_SECTION_CONTRADICTS_EARLIER_VERIFIED_CONCLUSION",
      "RETRIEVED_LESSON_TEXT_LEAKS_INTO_FINAL_RESPONSE",
      "SOURCE_DOMAIN_SURFACE_LANGUAGE_CONTAMINATION",
    ]) {
      assert.ok(classes.has(fc), fc);
    }
    const { keys } = seedBirthExecutiveLessons("ws_r4");
    assert.ok(keys.includes("birth.lesson.middle_claim_cannot_drop"));
    assert.ok(keys.includes("birth.lesson.cross_section_conclusion_reuse"));
    assert.ok(keys.includes("birth.lesson.lesson_principle_not_dump"));
  });

  it("16 corpus synthesizer gate still passes", () => {
    const report = runConstitutionalCorpus(
      (prompt) =>
        polishFinalVisibleAnswer(
          releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message,
          prompt,
        ),
      1,
    );
    assert.equal(report.fail, 0, JSON.stringify(report.results.filter((r) => !r.ok)));
  });
});
