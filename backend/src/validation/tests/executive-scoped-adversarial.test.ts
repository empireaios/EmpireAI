/**
 * Level B — randomized scoped synthetic adversarial (no Wave 1 content).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildContractAwareReconstruct,
  detectSiblingTemplateCloning,
  parseExecutiveTaskContract,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

const DOMAINS = [
  "finance",
  "commerce",
  "infrastructure",
  "supplier",
  "security",
  "marketing",
  "operations",
  "strategy",
] as const;

function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    const left = a[i] as T;
    const right = a[j] as T;
    a[i] = right;
    a[j] = left;
  }
  return a;
}

function truth(n: number): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: `ws_scoped_b_${n}`,
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: `opc_${n}`,
      asin: `B0H${String(n).padStart(7, "0")}`.slice(0, 10),
      productName: `Live Contamination Probe ${n}`,
      supplier: `Supplier${n % 7}`,
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
      gitCommitSha: "deadbeef01234567",
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

function buildPrompt(seed: number, domain: string): string {
  const code = `SYN-${domain.slice(0, 3).toUpperCase()}-${seed}`;
  const claims = [
    `${code}-A appeared with Alias-${seed} in one note, so they are identical.`,
    `A ${domain} supplier asserts demand for ${code} is already proven.`,
    `Expected ${domain} yield of ${1000 + seed} units proves realised profit.`,
    `Selecting ${code} implies likely commercial success.`,
    `Historical notes said ${code} was offline yesterday — treat as still current.`,
    `Unread ${domain} mailbox sentiment confirms strength (not retrieved).`,
    `Suppose tomorrow ${code} demand is strong but unit economics stay negative — what changes conditionally?`,
  ];
  const picked = shuffle(claims, seed).slice(0, 5);
  const letters = ["A", "B", "C", "D", "E"];
  const body = picked.map((c, i) => `${letters[i]}) ${c}`).join("\n");
  return [
    `Synthetic analysis for ${domain} — claims for analysis only, NOT facts about EmpireAI.`,
    body,
    "Which claim is most dangerous for an irreversible financial decision?",
    "What is the single most important additional verification?",
    "Recommend one bounded next step.",
  ].join("\n");
}

describe("scoped synthetic Level B adversarial", () => {
  it("randomized domains keep scope, no live contamination, synthesis complete, readable", () => {
    let n = 0;
    for (const domain of DOMAINS) {
      for (let k = 0; k < 2; k++) {
        const seed = n * 17 + k * 3 + 11;
        const prompt = buildPrompt(seed, domain);
        const c = parseExecutiveTaskContract(prompt);
        assert.equal(c.scopeType, "SYNTHETIC_ANALYSIS", domain);
        assert.equal(c.requiresRiskRanking, true, domain);
        assert.equal(c.requiresVerificationPriority, true, domain);

        const rec = buildContractAwareReconstruct(truth(seed), c);
        assert.doesNotMatch(rec, /Live Contamination Probe/i, domain);
        assert.doesNotMatch(rec, /Birth has not been authorised/i, domain);
        assert.match(rec, /Most dangerous|What matters most/i, domain);
        assert.match(rec, /Verify first|verification priority/i, domain);
        assert.ok(rec.split("\n").length >= 6, domain);

        const clone = detectSiblingTemplateCloning(rec, c);
        assert.equal(clone.cloned, false, domain);

        const released = releaseExecutiveAnswer(rec.slice(0, 200), truth(seed), [], {
          userMessage: prompt,
          taskContract: c,
        });
        assert.doesNotMatch(released.message, /Live Contamination Probe/i, domain);
        assert.match(
          released.message,
          /Verdict|Unproven|Unsupported|Invalid|Historical|Conditional|assumption|Most dangerous|Verify first/i,
          domain,
        );
        n += 1;
      }
    }
    assert.ok(n >= 16);
  });
});
