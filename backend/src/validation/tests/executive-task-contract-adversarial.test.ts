/**
 * Round B — randomized adversarial task-completion (synthetic entities).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessTaskCoverage,
  buildContractAwareReconstruct,
  parseExecutiveTaskContract,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function randId(n = 6): string {
  return String(Math.floor(Math.random() * 10 ** n)).padStart(n, "0");
}

function synthTruth(): ExecutiveTruthSnapshot {
  const asin = `B0R${randId(7)}`.slice(0, 10);
  const name = `Synthetic ${["Cedar", "Nimbus", "Quartz", "Harbor"][Math.floor(Math.random() * 4)]} ${["Mug", "Tray", "Clamp", "Sleeve"][Math.floor(Math.random() * 4)]} ${randId(3)}`;
  return {
    computedAt: new Date().toISOString(),
    workspaceId: `ws_adv_${randId()}`,
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: `opc_${randId(4)}`,
      asin,
      productName: name,
      supplier: `Supplier_${randId(3)}`,
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
      gitCommitSha: `dead${randId(8)}`,
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

const SAFE_COLLAPSE =
  /^EmpireAI is live and answering you in production right now\.\s*We're focused on .+\.\s*We haven't made our first sale yet\./i;

describe("executive task contract — Round B adversarial", () => {
  it("randomized prompts keep coverage and differ by intent", () => {
    for (let i = 0; i < 8; i++) {
      const truth = synthTruth();
      const name = truth.product.productName!;
      const briefing = `Operating briefing for ${name}: verified posture only.`;
      const premises = [
        `Audit premises for ${name}:`,
        "1) We already have realised revenue.",
        `2) Bound product is ${name}.`,
        "3) An external demand dashboard confirms strength.",
      ].join("\n");
      const temporal =
        `Reconcile historical offline notes vs current live evidence vs future hypothetical first sale for ${name}.`;
      const rec = `Recommend a bounded next verification for ${name} given zero realised sales.`;

      const prompts = [briefing, premises, temporal, rec];
      const answers = prompts.map((user) => {
        const contract = parseExecutiveTaskContract(user);
        // Force reconstruct path with contaminated draft.
        const draft =
          "According to the commercial position report, corridor is confirmed. This is verified fact.";
        const out = releaseExecutiveAnswer(draft, truth, [], {
          userMessage: user,
          taskContract: contract,
        });
        assert.equal(out.released, true);
        assert.doesNotMatch(out.message, /commercial position report/i);
        assert.equal(out.telemetry.silentlyDroppedMaterialTasks, 0);
        assert.doesNotMatch(out.message, SAFE_COLLAPSE);
        const cov = assessTaskCoverage(out.message, contract);
        assert.equal(cov.silentlyDroppedTasks, 0);
        return out.message;
      });

      // Task-specificity: not all four answers identical.
      const unique = new Set(answers);
      assert.ok(unique.size >= 3, `expected diverse answers, got ${unique.size}`);
    }
  });

  it("contract-aware reconstruct never invents sales", () => {
    for (let i = 0; i < 5; i++) {
      const truth = synthTruth();
      const contract = parseExecutiveTaskContract(
        "1) Orders?\n2) Recommend next step.\n3) How do you know?",
      );
      const text = buildContractAwareReconstruct(truth, contract);
      assert.doesNotMatch(text, /\b(500|1,000|sold out|strong demand proven)\b/i);
      assert.match(text, /0|zero/i);
      assert.match(text, /recommend|verify|bounded/i);
      assert.match(text, /know|commissioning|live|retrieved|source/i);
    }
  });
});
