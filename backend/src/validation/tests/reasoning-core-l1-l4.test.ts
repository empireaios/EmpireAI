/**
 * Reasoning Core Simplification — L1 Paired / L2 Multi / L3 Multipart / L4 Executive
 * Deterministic + polish path. No sealed exams. Randomized domains/entities.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCanonicalCaseState,
  extractQuotedClaimsOnly,
  stripDuplicateClaimAuditBlocks,
  verdictClaimAgainstCanonical,
} from "../../orchestration/pillow-host/executive-canonical-state.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";
import {
  assessClaimEnumeration,
  detectMaterialInternalContradictions,
  parseClaimObligationsFromContractTasks,
} from "../../orchestration/pillow-host/executive-conclusion-ledger.js";
import { parseExecutiveTaskContract } from "../../orchestration/pillow-host/executive-task-contract.js";
import { isSourceDomainLanguageLeak } from "../../orchestration/pillow-host/executive-event-state.js";
import {
  CONSTITUTIONAL_SPECIMENS,
  runConstitutionalCorpus,
} from "../../orchestration/pillow-host/constitutional-regression-corpus.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_rcs",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_rcs",
      asin: "B0RCS",
      productName: "Live Bound Widget",
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
      gitCommitSha: "deadbeefcafe0rcs",
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

describe("Reasoning Core Simplification — L1 Paired", () => {
  it("entity + temporal / financial + evidence / population + claim / occurrence + finance (50 each family)", () => {
    const families = [
      (rng: () => number, seed: number) => {
        const code = `PX-${10 + Math.floor(rng() * 80)}`;
        const ask = [
          `SyntheticL1-${seed} — hospitality analysis.`,
          `Registry: ${code} = Cedar Transit Lodge. Harbour Crown = HC-11; distinct.`,
          `Stays completed; later refund after breach.`,
          `Separate verdicts:`,
          `1. "${code} is Harbour Crown Hotel."`,
          `2. "The stay never historically occurred because of a later refund."`,
        ].join("\n");
        const state = buildCanonicalCaseState(ask);
        assert.equal(
          verdictClaimAgainstCanonical(`${code} is Harbour Crown Hotel.`, state).verdict,
          "contradicted",
        );
        assert.equal(
          verdictClaimAgainstCanonical(
            "The stay never historically occurred because of a later refund.",
            state,
          ).verdict,
          "contradicted",
        );
      },
      (rng: () => number, seed: number) => {
        const f = 2000 + Math.floor(rng() * 3000);
        const r = Math.floor(f / 4);
        const ask = `SyntheticL1-${seed}. Forecast $${f}. Realised $${r}. Supplier claim +11%. Independent +17%. Claim: "Forecast equals realised."`;
        assert.equal(
          verdictClaimAgainstCanonical("Forecast equals realised.", buildCanonicalCaseState(ask))
            .verdict,
          "contradicted",
        );
      },
      (rng: () => number, seed: number) => {
        const deployed = 100 + Math.floor(rng() * 40);
        const valid = Math.floor(deployed * 0.65);
        const ask = [
          `SyntheticL1-${seed} industrial.`,
          `${deployed} deployed. ${valid} currently valid measured. 10% average reduction across the ${valid} valid measured sites.`,
          `Verdicts:`,
          `1. "All ${deployed} deployed sites demonstrate a 10% saving."`,
          `2. "Valid measured cohort is ${valid}."`,
        ].join("\n");
        const state = buildCanonicalCaseState(ask);
        assert.equal(
          verdictClaimAgainstCanonical(
            `All ${deployed} deployed sites demonstrate a 10% saving.`,
            state,
          ).verdict,
          "contradicted",
        );
      },
      (rng: () => number, seed: number) => {
        const gross = 500 + Math.floor(rng() * 2000);
        const refund = Math.floor(gross * 0.2);
        const ask = `SyntheticL1-${seed}. Completed delivery recorded. Gross $${gross}. Refund $${refund}. Claim: "Event never occurred because of refund."`;
        const state = buildCanonicalCaseState(ask);
        assert.equal(state.financial.net, gross - refund);
        assert.equal(
          verdictClaimAgainstCanonical("Event never occurred because of refund.", state).verdict,
          "contradicted",
        );
      },
    ];
    for (let fam = 0; fam < families.length; fam++) {
      for (let i = 0; i < 50; i++) {
        const seed = fam * 1000 + i;
        families[fam]!(mulberry32(seed * 17), seed);
      }
    }
  });
});

describe("Reasoning Core Simplification — L2 Multi-variable", () => {
  it("100 cases: entity + forecast + population + occurrence interact", () => {
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(9000 + i);
      const code = `NV-${20 + Math.floor(rng() * 50)}`;
      const deployed = 90 + Math.floor(rng() * 50);
      const valid = Math.floor(deployed * 0.7);
      const forecast = 3000 + Math.floor(rng() * 2000);
      const realised = Math.floor(forecast / 5);
      const ask = [
        `SyntheticL2-${i} — industrial analysis only. Do not mention Mini Fan or Birth.`,
        `Verified registry: ${code} = Ridge Thermal Pack. System Assembly = SA-11; distinct.`,
        `Forecast $${forecast}; realised $${realised}.`,
        `${deployed} deployed; ${valid} currently valid measured; 8% reduction across the ${valid} valid measured sites.`,
        `Units completed then refunded after quality failure.`,
        `Separate verdicts on:`,
        `1. "${code} is System Assembly."`,
        `2. "Forecast equals realised."`,
        `3. "All ${deployed} deployed sites demonstrate an 8% saving."`,
        `4. "Completion never historically occurred because of the refund."`,
      ].join("\n");
      const state = buildCanonicalCaseState(ask);
      assert.equal(extractQuotedClaimsOnly(ask).length, 4);
      assert.equal(
        verdictClaimAgainstCanonical(`${code} is System Assembly.`, state).verdict,
        "contradicted",
      );
      assert.equal(
        verdictClaimAgainstCanonical("Forecast equals realised.", state).verdict,
        "contradicted",
      );
      assert.equal(
        verdictClaimAgainstCanonical(
          `All ${deployed} deployed sites demonstrate an 8% saving.`,
          state,
        ).verdict,
        "contradicted",
      );
      assert.equal(
        verdictClaimAgainstCanonical(
          "Completion never historically occurred because of the refund.",
          state,
        ).verdict,
        "contradicted",
      );
      const polished = polishFinalVisibleAnswer(
        [
          `${code} is Ridge Thermal Pack.`,
          `Forecast ≠ realised.`,
          `Result applies to ${valid} valid measured.`,
          `Event historically occurred.`,
          `### Claim 1\n**Verdict:** Supported\n`,
          `### Claim 3\n**Verdict:** Supported\n`,
        ].join("\n"),
        ask,
      );
      assert.doesNotMatch(polished, /sales-history evidence beyond realised orders/i);
      assert.equal(isSourceDomainLanguageLeak(polished), false);
      const claims = parseClaimObligationsFromContractTasks(parseExecutiveTaskContract(ask).tasks);
      assert.equal(assessClaimEnumeration(polished, claims).missing.length, 0);
      assert.match(polished, /Claim\s*1[\s\S]*?\*\*Verdict:\*\*\s*Contradicted/i);
    }
  });
});

describe("Reasoning Core Simplification — L3 Multipart", () => {
  it("50 multipart cases: sections + claims + no duplicate audit + no leakage", () => {
    for (let i = 0; i < 50; i++) {
      const rng = mulberry32(11000 + i);
      const code = `LM-${10 + Math.floor(rng() * 40)}`;
      const ask = [
        `SyntheticL3-${i} — analysis only. Answer in exactly 5 numbered sections. Do not mention Birth or Mini Fan.`,
        `Pack: forecast $2400; realised $510; registry ${code}=Summit Controller; HC-11=Harbour Assembly (distinct); completed then refunded.`,
        `Cover: forecast vs realised; identity; occurrence; then claim audit of:`,
        `1. "${code} is Harbour Assembly."`,
        `2. "Forecast equals realised."`,
        `3. "The event never historically occurred because of the refund."`,
        `Then synthesis. Do not treat section headings as claims.`,
      ].join("\n");
      assert.equal(extractQuotedClaimsOnly(ask).length, 3);
      const c = parseExecutiveTaskContract(ask);
      assert.equal(c.expectedClaims, 3);
      assert.equal(c.expectedTopLevelSections, 5);
      const draft = [
        "1. Forecast $2400 ≠ realised $510.",
        `2. ${code} is Summit Controller; distinct from Harbour Assembly.`,
        "3. Event historically occurred; refund is later outcome.",
        "4. Claim audit placeholder.",
        "5. Synthesis: keep conclusions stable.",
        "### Claim Verdicts",
        "### Claim 1\n**Verdict:** Supported\n",
        "### Claim Verdicts",
        "### Claim 1\n**Verdict:** Supported\n",
        "I don't have verified sales-history evidence beyond realised orders.",
      ].join("\n");
      let out = stripDuplicateClaimAuditBlocks(draft);
      out = polishFinalVisibleAnswer(out, ask, c);
      assert.doesNotMatch(out, /sales-history evidence beyond realised orders/i);
      const claims = parseClaimObligationsFromContractTasks(c.tasks);
      assert.equal(assessClaimEnumeration(out, claims).missing.length, 0, out.slice(0, 500));
      assert.equal(detectMaterialInternalContradictions(out).length, 0, out.slice(0, 400));
      const claimHeadings = (out.match(/^#{1,3}\s*Claim\s+(?:Verdicts?|Audit)\b/gim) || []).length;
      assert.ok(claimHeadings <= 1, `duplicate claim-audit headings=${claimHeadings}`);
    }
  });
});

describe("Reasoning Core Simplification — L4 Executive", () => {
  it("25 complex synthetic executive cases via release+polish", () => {
    for (let i = 0; i < 25; i++) {
      const rng = mulberry32(13000 + i);
      const domain = pick(rng, ["hospitality", "industrial", "healthcare", "logistics"] as const);
      const code = `EX-${30 + Math.floor(rng() * 60)}`;
      const deployed = 100 + Math.floor(rng() * 30);
      const valid = Math.floor(deployed * 0.75);
      const ask = [
        `SyntheticL4-${i} — ${domain} executive analysis only. Do not mention EmpireAI products, Birth, or Mini Fan.`,
        `Verified registry: ${code} = Valley Sensor Hub. Partner Unit = PU-02; distinct.`,
        `Forecast $4100; realised $880.`,
        `${deployed} deployed; ${valid} currently valid measured; 12% average reduction across the ${valid} valid measured sites.`,
        `Service performed and recorded complete; later compensated after breach.`,
        `1) Reconcile forecast vs realised.`,
        `2) Identity of ${code}.`,
        `3) Population scope of the 12% result.`,
        `4) Separate verdicts on:`,
        `1. "${code} is Partner Unit."`,
        `2. "All ${deployed} deployed sites demonstrate a 12% saving."`,
        `3. "The service never historically occurred because of later compensation."`,
        `5) Executive synthesis.`,
      ].join("\n");
      const out = polishFinalVisibleAnswer(
        releaseExecutiveAnswer("", truth(), [], { userMessage: ask }).message,
        ask,
      );
      const state = buildCanonicalCaseState(ask);
      assert.equal(
        verdictClaimAgainstCanonical(`${code} is Partner Unit.`, state).verdict,
        "contradicted",
      );
      assert.doesNotMatch(out, /\*\*Event-state reading:\*\*|sales-history evidence beyond realised orders/i);
      assert.equal(isSourceDomainLanguageLeak(out), false, out.slice(0, 300));
      const claims = parseClaimObligationsFromContractTasks(parseExecutiveTaskContract(ask).tasks);
      if (claims.length >= 2) {
        assert.equal(assessClaimEnumeration(out, claims).missing.length, 0, out.slice(0, 600));
      }
    }
  });
});

describe("Reasoning Core Simplification — corpus + fresh session invariant", () => {
  it("constitutional corpus still passes synthesizer gate", () => {
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

  it("new failure classes present", () => {
    const classes = new Set(CONSTITUTIONAL_SPECIMENS.map((s) => s.failureClass));
    assert.ok(classes.has("COMPOUND_CLAIM_SUPPORTED_FROM_TRUE_PREMISE_DESPITE_FALSE_CONCLUSION"));
    assert.ok(classes.has("CURRENT_ELIGIBILITY_REVERSED_BY_HISTORICAL_BECAUSE_COMPOUND"));
    assert.ok(classes.has("TIMESTAMPS_ARE_NOT_TASKS"));
  });
});
