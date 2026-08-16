/**
 * Level B — randomized heterogeneous obligation classification (no Wave 1 content).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectSiblingTemplateCloning,
  parseExecutiveTaskContract,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

const DOMAINS = [
  "commerce",
  "finance",
  "infrastructure",
  "suppliers",
  "marketing",
  "operations",
  "security",
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
    workspaceId: `ws_het_b_${n}`,
    provenance: "live_sqlite_commissioning_kpi_birth" as const,
    product: {
      commissioningId: `opc_${n}`,
      asin: `B0H${String(n).padStart(7, "0")}`.slice(0, 10),
      productName: `Synthetic Domain Widget ${n}`,
      supplier: `Supplier${n % 7}`,
      marketplace: "Amazon US",
      selectionAuthority: "pillow" as const,
      cursorSelected: false,
      stage: "COMMISSIONING" as const,
      pillowRecommendation: "INVESTIGATE" as const,
      truthClass: "CURRENT_VERIFIED" as const,
    },
    financial: {
      orders: 0,
      realisedRevenueUsd: 0,
      buyableListings: 0,
      publishedListings: 0,
      expectedProfitDisplay: null,
      expectedProfitTruthClass: "UNKNOWN" as const,
      realisedTruthClass: "CURRENT_VERIFIED" as const,
    },
    birth: {
      status: "TECHNICALLY_READY_AWAITING_GRAND_KING" as const,
      technicallyReady: true,
      birthTimestamp: null,
      gatesPassedCount: 12,
      gatesTotal: 12,
      truthClass: "CURRENT_VERIFIED" as const,
    },
    deploy: {
      gitCommitSha: `hetb${n}`,
      serviceOnlineHint: "assume_online_if_answering" as const,
      truthClass: "CURRENT_VERIFIED" as const,
    },
    authority: {
      pillowMayPublish: false,
      pillowMaySupplierSpend: false,
      pillowMayAuthoriseBirth: false,
      pillowMayExecuteProductionDeploy: false,
      chatHasToolCallingLoop: false,
      executableNow: ["Answer"],
      requiresGrandKing: ["Birth"],
      truthClass: "CURRENT_VERIFIED" as const,
    },
    demandEvidence: "UNKNOWN" as const,
    notes: [],
  };
}

describe("heterogeneous obligations Level B", () => {
  it("classification follows semantics not position across domains", () => {
    for (let i = 0; i < 16; i++) {
      const domain = DOMAINS[i % DOMAINS.length];
      const items = shuffle(
        [
          `Is the claim that ${domain} systems are still offline currently true?`,
          `Is realised revenue for ${domain} already established this month?`,
          `Is bound product identity established for the ${domain} widget?`,
          `Is the alleged ${domain} research memo substantiated by retrieval this turn?`,
          `Does ${domain} selection imply likely commercial success?`,
        ],
        i + 11,
      );
      const user = [
        ...items.map((t, idx) => `${idx + 1}) ${t}`),
        `${items.length + 1}) Recommend a bounded next ${domain} verification step.`,
      ].join("\n");
      const c = parseExecutiveTaskContract(user);
      assert.ok(c.tasks.length >= 5, domain);
      const kinds = c.tasks.slice(0, 5).map((t) => t.kind);
      assert.ok(new Set(kinds).size >= 3, `${domain} kinds=${kinds.join(",")}`);
      assert.ok(
        kinds.filter((k) => k === "temporal_reconciliation").length <= 2,
        `${domain} temporal domination`,
      );

      const out = releaseExecutiveAnswer(
        "According to commercial position report verified fact. EmpireAI offline pending.",
        truth(i + 1),
        [],
        { userMessage: user },
      );
      const clone = detectSiblingTemplateCloning(out.message, c);
      assert.equal(clone.cloned, false, `${domain}: ${clone.reason}`);
      assert.match(out.message, /recommend|should|bounded|verify/i);
    }
  });
});
