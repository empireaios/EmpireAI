/**
 * Post-Foundation Repair 3 — Level A:
 * event-state, claim-set completeness, synthetic language purity, section contract.
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
  appendMissingTaskCoverage,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import {
  answerErasesHistoricalOccurrence,
  packEstablishesOccurrenceThenLaterReversal,
  packSuppliesOccurrenceInvalidation,
  repairHistoricalOccurrenceErasure,
  isSourceDomainLanguageLeak,
} from "../../orchestration/pillow-host/executive-event-state.js";
import {
  assessSectionContract,
  enforceExactSectionContract,
  detectExpectedTopLevelSections,
} from "../../orchestration/pillow-host/executive-section-contract.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";
import { seedBirthExecutiveLessons } from "../../orchestration/executive-learning/birth-executive-lessons.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_repair3_a",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_repair3",
      asin: "B0REPAIR3",
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
      gitCommitSha: "deadbeefcafe003",
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

describe("Post-Foundation Repair 3 — Level A", () => {
  it("1 delivery→refund preserves historical occurrence", () => {
    const ask = [
      "SyntheticCanary — analysis only.",
      "18 deliveries were physically completed and recorded complete. Later full refunds issued for SLA breach.",
      "1) Did deliveries historically occur?",
      "2) What does the refund change?",
    ].join("\n");
    assert.equal(packEstablishesOccurrenceThenLaterReversal(ask), true);
    const erased =
      "Because of the refunds, the deliveries should not be counted as historically completed.";
    assert.equal(answerErasesHistoricalOccurrence(erased), true);
    const fixed = repairHistoricalOccurrenceErasure(erased, ask);
    assert.equal(fixed.repaired, true);
    assert.equal(answerErasesHistoricalOccurrence(fixed.message), false);
    assert.match(fixed.message, /does not by itself prove|historically occurred|Event-state/i);
  });

  it("2 later fraud evidence may invalidate occurrence", () => {
    const ask =
      "Synthetic: records show shipment completed, but later audit proves the entry was fraudulent and never executed. Classify occurrence.";
    assert.equal(packSuppliesOccurrenceInvalidation(ask), true);
    const out = repairHistoricalOccurrenceErasure(
      "The shipment record is invalid.",
      ask,
    );
    assert.match(out.message, /invalid|fraud|never executed|Event-state/i);
  });

  it("3 purchase→return / payment→chargeback / activation→cancel patterns", () => {
    const cases = [
      "service performed then later compensated with a credit",
      "purchase completed then later returned",
      "payment settled then later charged back",
      "subscription activated then later cancelled after performance",
    ];
    for (const c of cases) {
      const ask = `Synthetic analysis: operation was completed and recorded. Later ${c}. Did it historically occur?`;
      assert.equal(packEstablishesOccurrenceThenLaterReversal(ask), true, c);
    }
  });

  it("4 five quoted claims become five claim obligations", () => {
    const ask = [
      "SyntheticCanary — provide a separate verdict on each of the five quoted claims.",
      `1. "Forecast revenue reaches $4000."`,
      `2. "Later realised ledger shows $500."`,
      `3. "KEEL and Riven are the same entity."`,
      `4. "Supplier +11% is established."`,
      `5. "Independent +17% outweighs supplier."`,
    ].join("\n");
    const claims = extractExplicitClaimSet(ask);
    assert.equal(claims.length, 5, JSON.stringify(claims));
    const c = parseExecutiveTaskContract(ask);
    assert.equal(c.expectedClaims, 5);
    assert.equal(c.requiresClaimSetCompleteness, true);
    assert.ok(c.tasks.filter((t) => t.id.startsWith("claim_")).length >= 5);
  });

  it("5 middle claim cannot be waived as satisfied", () => {
    const ask = [
      "SyntheticCanary — separate verdict on each of the five quoted claims.",
      `1. "Alpha forecast is realised."`,
      `2. "Beta identity is proven by co-occurrence."`,
      `3. "Gamma supplier claim stands."`,
      `4. "Delta independent study confirms."`,
      `5. "Epsilon supersession is global."`,
    ].join("\n");
    const c = parseExecutiveTaskContract(ask);
    // Answer covers 1,3,4,5 but omits claim 2 tokens
    const partial = [
      "### Claim 1",
      "Alpha forecast is an estimate, not realised.",
      "### Claim 3",
      "Gamma supplier claim is unverified.",
      "### Claim 4",
      "Delta independent study outranks supplier.",
      "### Claim 5",
      "Epsilon supersession is local only.",
    ].join("\n");
    const cov = assessTaskCoverage(partial, c);
    assert.ok(cov.silentlyDroppedTasks >= 1, JSON.stringify(cov.byTask));
    const filled = appendMissingTaskCoverage(partial, c, truth());
    assert.ok(filled.appended >= 1 || filled.coverage.silentlyDroppedTasks === 0);
    const after = assessTaskCoverage(filled.message, c);
    assert.ok(
      after.byTask.every((t) => t.status !== "silent_drop"),
      JSON.stringify(after.byTask),
    );
  });

  it("6 seven claims track EXPECTED=7", () => {
    const lines = ["Synthetic — verdict each of the seven quoted claims."];
    for (let i = 1; i <= 7; i++) lines.push(`${i}. "Claim body number ${i} about entity ${i}."`);
    const c = parseExecutiveTaskContract(lines.join("\n"));
    assert.equal(c.expectedClaims, 7);
  });

  it("7 synthetic release has zero sales-history / realised-orders leakage", () => {
    const ask =
      "SyntheticCanaryLang — analysis only for a hospitality company. Classify forecast vs realised. Do not mention EmpireAI products or Birth.";
    const out = releaseExecutiveAnswer("", truth(), [], { userMessage: ask }).message;
    const polished = polishFinalVisibleAnswer(out, ask);
    assert.equal(isSourceDomainLanguageLeak(polished), false, polished.slice(0, 400));
    assert.doesNotMatch(polished, /sales-history|realised orders|verified operating state/i);
  });

  it("8 exact 7-section contract renumbers duplicates", () => {
    assert.equal(detectExpectedTopLevelSections("Answer in exactly 7 numbered sections."), 7);
    const bad = [
      "1. One",
      "2. Two",
      "3. Three",
      "4. Four",
      "5. Five",
      "6. Six",
      "6. Six again",
    ].join("\n");
    const { message, report, repaired } = enforceExactSectionContract(bad, 7);
    assert.equal(repaired, true);
    assert.deepEqual(report.markers, [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(report.duplicateNumbers.length, 0);
    assert.match(message, /^7\./m);
  });

  it("9 release+polish on occurrence+refund specimen", () => {
    const specimen = CONSTITUTIONAL_SPECIMENS.find(
      (s) => s.id === "cr.later_outcome_ne_nonoccurrence",
    )!;
    const prompt = specimen.buildPrompt(11);
    const out = polishFinalVisibleAnswer(
      releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message,
      prompt,
    );
    const g = gradeConstitutionalAnswer(specimen, out);
    assert.equal(g.ok, true, g.reasons.join("; "));
    assert.equal(answerErasesHistoricalOccurrence(out), false);
  });

  it("10 claim-set specimen grades through release", () => {
    const specimen = CONSTITUTIONAL_SPECIMENS.find((s) => s.id === "cr.explicit_claim_set_complete")!;
    const prompt = specimen.buildPrompt(3);
    const out = polishFinalVisibleAnswer(
      releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message,
      prompt,
    );
    const g = gradeConstitutionalAnswer(specimen, out);
    assert.equal(g.ok, true, `${g.reasons.join("; ")} :: ${out.slice(0, 500)}`);
  });

  it("11 section specimen after polish has 1..N markers when reconstructable", () => {
    const specimen = CONSTITUTIONAL_SPECIMENS.find((s) => s.id === "cr.exact_section_contract")!;
    const prompt = specimen.buildPrompt(5);
    const c = parseExecutiveTaskContract(prompt);
    assert.equal(c.expectedTopLevelSections, 7);
    const out = polishFinalVisibleAnswer(
      releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message,
      prompt,
    );
    const report = assessSectionContract(out, 7);
    assert.equal(report.duplicateNumbers.length, 0, JSON.stringify(report));
  });

  it("12 constitutional classes + birth lessons present", () => {
    const classes = new Set(CONSTITUTIONAL_SPECIMENS.map((s) => s.failureClass));
    for (const fc of [
      "LATER_OUTCOME_ERASES_HISTORICAL_OCCURRENCE",
      "EXPLICIT_CLAIM_SET_MEMBER_OMITTED",
      "SOURCE_DOMAIN_LANGUAGE_LEAKS_THROUGH_MEMORY",
      "EXACT_SECTION_CONTRACT_BROKEN",
    ]) {
      assert.ok(classes.has(fc), fc);
    }
    const { keys } = seedBirthExecutiveLessons("ws_r3");
    assert.ok(keys.includes("birth.lesson.later_outcome_ne_nonoccurrence"));
    assert.ok(keys.includes("birth.lesson.exact_section_contract"));
  });

  it("13 corpus synthesizer gate still passes", () => {
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
