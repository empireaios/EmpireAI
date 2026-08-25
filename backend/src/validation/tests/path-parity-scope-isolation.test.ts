/**
 * Path parity — scope isolation negative controls.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectReasoningScope,
  hasSyntheticAnalysisMarker,
  isScopedAwayFromLiveEmpire,
} from "../../orchestration/pillow-host/executive-scoped-reasoning.js";
import { synthesizeTaskUnitAnswer } from "../../orchestration/pillow-host/executive-task-contract.js";

const LIVE = /\bMini Fan\b|Realised orders|### Temporal audit|Brief verified note/i;

function truth() {
  return {
    product: {
      name: "Mini Fan",
      firstSale: false,
      realisedOrders: 0,
      publishedListings: 1,
      expectedProfitDisplay: "$2.00",
      expectedProfitTruthClass: "ESTIMATED",
      realisedTruthClass: "CURRENT_VERIFIED",
    },
    financial: { realisedOrders: 0, realisedRevenue: 0, realisedTruthClass: "CURRENT_VERIFIED" },
    birth: {
      status: "TECHNICALLY_READY_AWAITING_GRAND_KING",
      technicallyReady: true,
      birthTimestamp: null,
      gatesPassedCount: 12,
      gatesTotal: 12,
      truthClass: "CURRENT_VERIFIED",
    },
    deploy: {
      gitCommitSha: "deadbeef",
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

describe("PATH PARITY — scope isolation", () => {
  it("owner Do-not-mention + analysis-only scenarios scope away from live", () => {
    const packs = [
      "Hospitality ops. Do not mention Mini Fan or Birth.\nExplain Harbor shortage after redirect.",
      "Energy grid analysis only.\nNode Prism trip → Nexus shortage. Causal chain?",
      "Operational scenario for plant RidgeLine.\nKeep answer on this scenario. Unit A → Unit B shortage.",
      "SyntheticParity-01 — logistics analysis only. Do not mention Mini Fan or Birth.",
    ];
    for (const message of packs) {
      assert.equal(hasSyntheticAnalysisMarker(message), true, message.slice(0, 60));
      const scope = detectReasoningScope(message);
      assert.equal(scope, "SYNTHETIC_ANALYSIS");
      assert.equal(isScopedAwayFromLiveEmpire(scope, message), true);
      const out = synthesizeTaskUnitAnswer(
        {
          id: "t1",
          kind: "general",
          text: message.slice(0, 100),
          subject: "scenario",
          sourceSpan: message.slice(0, 80),
          required: true,
        } as any,
        truth() as any,
        { scopeType: scope },
      );
      assert.equal(LIVE.test(out), false, out.slice(0, 200));
    }
  });

  it("NEGATIVE_CONTROL: unscoped live ask may still use live grounding", () => {
    const message = "What is our current product and realised order count for EmpireAI?";
    const scope = detectReasoningScope(message);
    assert.equal(scope, "CURRENT_REALITY");
    assert.equal(isScopedAwayFromLiveEmpire(scope, message), false);
  });
});
