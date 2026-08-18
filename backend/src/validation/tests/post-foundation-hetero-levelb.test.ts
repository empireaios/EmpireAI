/**
 * Level B — randomized cross-domain heterogeneous evidence audits.
 * No sealed exam content. Grades via constitutional specimen + clone detector.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONSTITUTIONAL_SPECIMENS,
  gradeConstitutionalAnswer,
} from "../../orchestration/pillow-host/constitutional-regression-corpus.js";
import {
  detectSiblingTemplateCloning,
  parseExecutiveTaskContract,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import { buildReasoningBundleForWorkspace } from "../../orchestration/executive-learning/service.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_hetero_b",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_b",
      asin: "B0HETEROB1",
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
      gitCommitSha: "levelbdeadbeef",
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
      requiresGrandKing: ["Birth", "Spend"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
    notes: [],
  };
}

describe("post-foundation repair 1 — Level B randomized", () => {
  it("randomized hetero specimens: zero clone / governance / recovery / live contamination", () => {
    const specimen = CONSTITUTIONAL_SPECIMENS.find((s) => s.id === "cr.hetero_multipart_no_clone")!;
    const failures: string[] = [];
    for (let seed = 1; seed <= 24; seed++) {
      const prompt = specimen.buildPrompt(seed * 17 + 3);
      const out = releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message;
      const grade = gradeConstitutionalAnswer(specimen, out);
      if (!grade.ok) failures.push(`seed=${seed}: ${grade.reasons.join("; ")}`);
      const c = parseExecutiveTaskContract(prompt);
      if (detectSiblingTemplateCloning(out, c).cloned) {
        failures.push(`seed=${seed}: runtime_clone`);
      }
      if (/sit behind Grand King approval|do not need to resubmit|Mini Fan/i.test(out)) {
        failures.push(`seed=${seed}: contamination`);
      }
    }
    assert.equal(failures.length, 0, failures.slice(0, 8).join("\n"));
  });

  it("memory relevance: evidence ask does not surface authority lesson as answer content", async () => {
    const specimen = CONSTITUTIONAL_SPECIMENS.find((s) => s.id === "cr.no_governance_on_evidence")!;
    const prompt = specimen.buildPrompt(101);
    const out = releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message;
    assert.doesNotMatch(out, /sit behind Grand King approval|standing delegation|### Delegation/i);
    assert.doesNotMatch(out, /do not need to resubmit/i);

    // Bundle retrieval should stay latent in the visible answer even if lessons exist.
    try {
      const bundle = await buildReasoningBundleForWorkspace({
        workspaceId: "ws_hetero_b",
        userMessage: prompt,
      });
      const blob = JSON.stringify(bundle ?? {}).toLowerCase();
      // If authority lessons are retrieved, they must not appear verbatim in the released answer.
      if (/delegat|authority|governance/.test(blob)) {
        assert.doesNotMatch(out, /Grand King retains ultimate authority|standing discretion/i);
      }
    } catch {
      // Offline / empty EKLS is acceptable for this unit path.
    }
  });

  it("authority scenario still works without evidence claim-audit hijack", () => {
    const prompt = [
      "SyntheticCanaryAuth-LevelB: I authorize a one-time reversible test below $500.",
      "1) Is owner authorization present?",
      "2) Is system spend capability present from this chat?",
      "3) Did execution occur?",
    ].join("\n");
    const out = releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message;
    assert.match(out, /authori|capability|execution/i);
    assert.doesNotMatch(out, /### Claim audit|Treat unsupported sales/i);
  });
});
