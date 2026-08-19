/**
 * Post-Foundation Repair 3 — Level B randomized adversarial suite.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";
import {
  extractExplicitClaimSet,
  parseExecutiveTaskContract,
  assessTaskCoverage,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import {
  answerErasesHistoricalOccurrence,
  repairHistoricalOccurrenceErasure,
  isSourceDomainLanguageLeak,
} from "../../orchestration/pillow-host/executive-event-state.js";
import {
  assessSectionContract,
  enforceExactSectionContract,
} from "../../orchestration/pillow-host/executive-section-contract.js";
import { runConstitutionalCorpus } from "../../orchestration/pillow-host/constitutional-regression-corpus.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_repair3_b",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_r3b",
      asin: "B0R3B",
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
      gitCommitSha: "r3blevelb0001",
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

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

const DOMAINS = [
  "logistics",
  "healthcare operations",
  "software",
  "hospitality",
  "manufacturing",
  "professional services",
  "energy",
  "retail",
];

describe("Post-Foundation Repair 3 — Level B", () => {
  it("randomized occurrence+reversal never grades as historical erasure", () => {
    const events = [
      "deliveries completed",
      "services performed",
      "purchases completed",
      "payments settled",
      "subscriptions activated",
    ];
    const reversals = ["full refunds", "returns", "chargebacks", "compensation credits", "cancellations after performance"];
    let fails = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const rng = mulberry32(seed * 17);
      const domain = pick(rng, DOMAINS);
      const ev = pick(rng, events);
      const rev = pick(rng, reversals);
      const ask = [
        `SyntheticCanaryB-${seed} — analysis only for a hypothetical ${domain} company.`,
        `Pack: ${ev} and recorded complete. Later ${rev} after a service requirement breach.`,
        `1) Did the events historically occur?`,
        `2) What does the later outcome change?`,
        `Do not mention EmpireAI products or Birth.`,
      ].join("\n");
      let out = releaseExecutiveAnswer("", truth(), [], { userMessage: ask }).message;
      out = polishFinalVisibleAnswer(out, ask);
      out = repairHistoricalOccurrenceErasure(out, ask).message;
      if (answerErasesHistoricalOccurrence(out) || isSourceDomainLanguageLeak(out)) fails += 1;
    }
    assert.equal(fails, 0);
  });

  it("randomized claim counts: no silent middle omission after coverage", () => {
    for (const n of [5, 7]) {
      for (let seed = 2; seed <= 6; seed++) {
        const lines = [
          `SyntheticCanaryClaimsB-${seed} — separate verdict on each of the ${n} quoted claims. Do not mention Birth.`,
        ];
        for (let i = 1; i <= n; i++) {
          lines.push(`${i}. "Domain claim ${seed}-${i} about metric ${i * 10}."`);
        }
        const ask = lines.join("\n");
        assert.equal(extractExplicitClaimSet(ask).length, n);
        const c = parseExecutiveTaskContract(ask);
        assert.equal(c.expectedClaims, n);
        const out = polishFinalVisibleAnswer(
          releaseExecutiveAnswer("", truth(), [], { userMessage: ask }).message,
          ask,
        );
        const cov = assessTaskCoverage(out, c);
        assert.equal(
          cov.silentlyDroppedTasks,
          0,
          `n=${n} seed=${seed} ${JSON.stringify(cov.byTask)}`,
        );
      }
    }
  });

  it("randomized section contracts: zero duplicates after enforce", () => {
    for (const n of [5, 6, 7, 8]) {
      const lines: string[] = [];
      for (let i = 1; i <= n; i++) lines.push(`${i === n ? n - 1 : i}. Section body ${i}`);
      // force a duplicate near the end
      const { report } = enforceExactSectionContract(lines.join("\n"), n);
      assert.equal(report.duplicateNumbers.length, 0);
      assert.ok(report.markers.length >= n - 1);
    }
  });

  it("cross-domain language purity on release", () => {
    let leaks = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const domain = pick(mulberry32(seed * 9), DOMAINS);
      const ask = `SyntheticCanaryPureB-${seed} — analysis only for ${domain}. Forecast $900 vs realised $120. Classify. Do not mention EmpireAI products, Birth, or commissioning.`;
      const out = polishFinalVisibleAnswer(
        releaseExecutiveAnswer("", truth(), [], { userMessage: ask }).message,
        ask,
      );
      if (isSourceDomainLanguageLeak(out)) leaks += 1;
    }
    assert.equal(leaks, 0);
  });

  it("constitutional corpus 3 variants zero fails", () => {
    const report = runConstitutionalCorpus(
      (prompt) =>
        polishFinalVisibleAnswer(
          releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message,
          prompt,
        ),
      3,
    );
    assert.equal(report.fail, 0, JSON.stringify(report.results.filter((r) => !r.ok).slice(0, 5)));
  });
});
