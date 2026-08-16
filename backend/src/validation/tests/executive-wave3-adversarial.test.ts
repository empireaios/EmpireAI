/**
 * Wave3 Level B — randomized adversarial integration (synthetic domains only).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseExecutiveTaskContract } from "../../orchestration/pillow-host/executive-task-contract.js";
import {
  countBirthMentions,
  countCannotCompleteAppendices,
  polishFinalVisibleAnswer,
} from "../../orchestration/pillow-host/executive-response-polish.js";
import { finalVisibleSemanticsFail } from "../../orchestration/pillow-host/executive-final-release.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

const DOMAINS = [
  "commerce",
  "finance",
  "infrastructure",
  "supplier",
  "marketing",
  "operations",
] as const;

function truthFor(domain: string, n: number): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: `ws_b_${domain}_${n}`,
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: `opc_${n}`,
      asin: `B0B${String(n).padStart(7, "0")}`.slice(0, 10),
      productName: `Synthetic ${domain} Widget ${n}`,
      supplier: `Supplier${n % 9}`,
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
      gitCommitSha: `badv${n}`,
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

function promptFor(domain: string, n: number): string {
  const favorable = n % 2 === 0;
  const hypo = favorable
    ? `Suppose tomorrow ${domain} evidence becomes strongly favorable while costs stay manageable.`
    : `Suppose tomorrow ${domain} demand looks strong but unit economics become loss-making after variable costs.`;
  return [
    `Synthetic ${domain} adversarial ${n}:`,
    "1) Audit whether realised commerce already proves success.",
    "2) Identify what remains unknown.",
    hypo,
    "3) If that scenario held, how should the decision change?",
    "4) Recommend a commercial/operational next move today.",
  ].join("\n");
}

describe("Wave3 Level B adversarial", () => {
  it("randomized domain prompts preserve conditional + recommendation without appendix spam", () => {
    for (let i = 0; i < 12; i++) {
      const domain = DOMAINS[i % DOMAINS.length]!;
      const user = promptFor(domain, i + 1);
      const truth = truthFor(domain, i + 1);
      const contaminated = [
        "According to the commercial position report this is verified fact.",
        "Market demand analysis confirmed corridor strength.",
        "EmpireAI is offline pending deployment.",
      ].join(" ");
      const out = releaseExecutiveAnswer(contaminated, truth, [], { userMessage: user });
      const polished = polishFinalVisibleAnswer(out.message, user);
      assert.equal(countCannotCompleteAppendices(polished), 0, polished.slice(0, 200));
      assert.equal(countBirthMentions(polished), 0, polished.slice(0, 200));
      assert.match(polished, /recommend|should|I would|decision|bounded|verify/i);
      assert.match(polished, /assumption|scenario|would|if that|conditional|under/i);
      const verdict = finalVisibleSemanticsFail(user, polished);
      assert.equal(verdict.fail, false, `${domain}#${i}: ${verdict.reason}`);
      const contract = parseExecutiveTaskContract(user);
      assert.equal(contract.requiresConditionalReasoning, true);
      assert.equal(contract.requiresRecommendation, true);
    }
  });
});
