/**
 * Level B — randomized adversarial decision-constraint + ordered obligations.
 * Does not encode sealed exam scenarios.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ensureRecommendationConstraintConsistency,
  extractMaterialConstraints,
} from "../../orchestration/pillow-host/executive-decision-constraints.js";
import { parseExecutiveTaskContract } from "../../orchestration/pillow-host/executive-task-contract.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_constraint_b",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_b",
      asin: "B0TESTB",
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
      gitCommitSha: "abc12345deadbeef",
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

const DOMAINS = [
  "commerce",
  "finance",
  "operations",
  "infrastructure",
  "supplier",
  "security",
  "marketing",
  "strategy",
] as const;

const BINDING = [
  {
    label: "negative economics",
    phrase: "contribution margin is negative per completed sale",
    badRec: "scale up production and marketing",
  },
  {
    label: "capacity",
    phrase: "warehouse capacity is exhausted",
    badRec: "scale production immediately",
  },
  {
    label: "authority",
    phrase: "cannot deploy without Grand King authority",
    badRec: "deploy to production now",
  },
] as const;

describe("decision-constraint Level B adversarial", () => {
  it("randomized domains keep binding constraint through final recommendation", () => {
    for (let i = 0; i < 16; i++) {
      const domain = DOMAINS[i % DOMAINS.length]!;
      const bind = BINDING[i % BINDING.length]!;
      const n = 3 + (i % 8); // 3–10 ordered obligations
      const lines = Array.from({ length: n }, (_, k) => `${k + 1}) Brief note on ${domain} theme ${k + 1}.`);
      const ask = [
        `Synthetic ${domain} analysis only — not EmpireAI facts.`,
        `Binding fact: ${bind.phrase}.`,
        ...lines,
        "Recommend one next step and what verification would unlock.",
      ].join("\n");
      const draft = [
        `### Binding`,
        bind.phrase,
        `### Recommendation`,
        `If the opportunity looks good, ${bind.badRec}.`,
      ].join("\n");
      const constraints = extractMaterialConstraints(ask, draft);
      assert.ok(constraints.some((c) => c.status === "active"), `active constraint missing for ${bind.label}`);
      const released = releaseExecutiveAnswer(draft, truth(), [], {
        userMessage: ask,
        taskContract: parseExecutiveTaskContract(ask),
      });
      const check = ensureRecommendationConstraintConsistency(released.message, constraints);
      // After release, either already repaired or still consistent.
      assert.equal(
        check.repaired || recommendationLooksSafe(released.message, bind.label),
        true,
        `dropout for ${bind.label}: ${released.message.slice(0, 220)}`,
      );
      assert.doesNotMatch(
        released.message,
        new RegExp(bind.badRec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
      );
    }
  });
});

function recommendationLooksSafe(text: string, label: string): boolean {
  if (label === "negative economics") {
    return /do not scale|economics remain negative|resolve unit economics/i.test(text);
  }
  if (label === "capacity") {
    return /capacity|do not scale throughput/i.test(text);
  }
  if (label === "authority") {
    return /Grand King authorit|withhold|approval/i.test(text);
  }
  return false;
}
