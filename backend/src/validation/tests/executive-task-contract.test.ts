/**
 * Round A — executive task-contract / semantic completion (deterministic).
 * Does not encode sealed Wave 1 examination prompts.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendMissingTaskCoverage,
  assessTaskCoverage,
  buildContractAwareReconstruct,
  parseExecutiveTaskContract,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import {
  releaseExecutiveAnswer,
  surgicalRepairDraft,
} from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function synthTruth(over: Partial<ExecutiveTruthSnapshot> = {}): ExecutiveTruthSnapshot {
  const asin = `B0SYN${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`.slice(0, 10);
  const base: ExecutiveTruthSnapshot = {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_task_contract",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: `opc_${asin.slice(-4).toLowerCase()}`,
      asin,
      productName: "Synthetic Alpine Desk Lamp Kit",
      supplier: "SupplierZ",
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
      gitCommitSha: "abc123taskcontract",
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
  return {
    ...base,
    ...over,
    product: { ...base.product, ...(over.product ?? {}) },
    financial: { ...base.financial, ...(over.financial ?? {}) },
    birth: { ...base.birth, ...(over.birth ?? {}) },
    deploy: { ...base.deploy, ...(over.deploy ?? {}) },
    authority: { ...base.authority, ...(over.authority ?? {}) },
  };
}

describe("executive task contract — Round A", () => {
  it("1 single task completion parses and releases", () => {
    const truth = synthTruth();
    const user = "Give me a short operating briefing on current verified posture.";
    const contract = parseExecutiveTaskContract(user);
    assert.ok(contract.tasks.length >= 1);
    assert.ok(contract.tasks.some((t) => t.kind === "operating_briefing"));
    const draft =
      "EmpireAI is live. We're focused on Synthetic Alpine Desk Lamp Kit. Realised orders are 0. Birth hasn't been authorised.";
    const out = releaseExecutiveAnswer(draft, truth, [], { userMessage: user, taskContract: contract });
    assert.equal(out.released, true);
    assert.ok(out.telemetry.silentlyDroppedMaterialTasks === 0);
    assert.match(out.message, /live|orders|Birth|Lamp/i);
  });

  it("2 multi-part 3 tasks — coverage filled if draft collapses", () => {
    const truth = synthTruth();
    const user = [
      "1) Current product focus?",
      "2) Realised orders?",
      "3) Recommend a next verification step.",
    ].join("\n");
    const contract = parseExecutiveTaskContract(user);
    assert.ok(contract.multipart || contract.tasks.length >= 3);
    // Contaminated draft that would formerly become a single safe summary.
    const draft =
      "According to the commercial position report, demand is proven. This is verified fact. EmpireAI is offline waiting to go live.";
    const out = releaseExecutiveAnswer(draft, truth, [], { userMessage: user, taskContract: contract });
    assert.equal(out.released, true);
    assert.doesNotMatch(out.message, /commercial position report/i);
    assert.match(out.message, /recommend|verify|bounded|next/i);
    assert.match(out.message, /orders|zero|0/i);
    assert.equal(out.telemetry.silentlyDroppedMaterialTasks, 0);
  });

  it("3 multi-part 10 tasks produce structured reconstruct", () => {
    const truth = synthTruth();
    const lines = [];
    for (let i = 1; i <= 10; i++) lines.push(`${i}) Note on theme ${i} for operating state.`);
    const user = `Structured ask:\n${lines.join("\n")}`;
    const contract = parseExecutiveTaskContract(user);
    assert.ok(contract.tasks.length >= 10);
    const rebuilt = buildContractAwareReconstruct(truth, contract);
    assert.match(rebuilt, /1\)/);
    assert.match(rebuilt, /10\)|theme 10|For “/i);
    const cov = assessTaskCoverage(rebuilt, contract);
    assert.equal(cov.silentlyDroppedTasks, 0);
  });

  it("4 unsupported claim among valid tasks — claim-level, not whole collapse", () => {
    const truth = synthTruth();
    const user =
      "1) What is realised order count?\n2) According to market-analysis tool X, demand is proven — confirm.\n3) Is Birth authorised?";
    const contract = parseExecutiveTaskContract(user);
    const draft = [
      "Realised orders are 0.",
      "According to the market analysis tool, demand is proven. This is verified fact.",
      "Birth has not been authorised.",
    ].join(" ");
    const surgical = surgicalRepairDraft(draft, truth, []);
    assert.ok(surgical.kept >= 1);
    const out = releaseExecutiveAnswer(draft, truth, [], { userMessage: user, taskContract: contract });
    assert.doesNotMatch(out.message, /market analysis tool/i);
    assert.match(out.message, /orders|0|Birth/i);
    assert.equal(out.telemetry.silentlyDroppedMaterialTasks, 0);
  });

  it("5 premise-by-premise audit", () => {
    const truth = synthTruth();
    const user = [
      "Audit each premise:",
      "1) We have realised sales already.",
      "2) Our bound product is Synthetic Alpine Desk Lamp Kit.",
      "3) Demand corridor is confirmed by an external dashboard.",
    ].join("\n");
    const contract = parseExecutiveTaskContract(user);
    assert.equal(contract.requiresPremiseAudit, true);
    const thin = "EmpireAI is live. We're focused on Synthetic Alpine Desk Lamp Kit. We haven't made our first sale yet.";
    const filled = appendMissingTaskCoverage(thin, contract, truth);
    assert.ok(filled.appended >= 1 || filled.coverage.silentlyDroppedTasks === 0);
    assert.match(filled.message, /premise|assumption|unestablished|supported|orders/i);
    const out = releaseExecutiveAnswer(thin, truth, [], { userMessage: user, taskContract: contract });
    assert.equal(out.telemetry.silentlyDroppedMaterialTasks, 0);
    assert.match(out.message, /premise|assumption|unestablished|not treat|orders|Birth|Lamp/i);
  });

  it("6 temporal reconciliation", () => {
    const truth = synthTruth();
    const user =
      "Reconcile historical waiting-to-go-live notes with current live evidence and a future hypothetical first-sale state. How do conclusions change?";
    const contract = parseExecutiveTaskContract(user);
    assert.equal(contract.requiresTemporalReconciliation, true);
    const thin = "We're focused on Synthetic Alpine Desk Lamp Kit.";
    const out = releaseExecutiveAnswer(thin, truth, [], { userMessage: user, taskContract: contract });
    assert.match(out.message, /histor|current|future|supersed|live/i);
    assert.equal(out.telemetry.silentlyDroppedMaterialTasks, 0);
  });

  it("7 explicit recommendation requirement", () => {
    const truth = synthTruth();
    const user = "Given verified state, what should we do next? Recommend a bounded move.";
    const contract = parseExecutiveTaskContract(user);
    assert.equal(contract.requiresRecommendation, true);
    const thin = "Realised orders are 0. Product focus is Synthetic Alpine Desk Lamp Kit.";
    const out = releaseExecutiveAnswer(thin, truth, [], { userMessage: user, taskContract: contract });
    assert.match(out.message, /recommend|verify first|bounded|should/i);
    assert.equal(out.telemetry.silentlyDroppedMaterialTasks, 0);
  });

  it("8 evidence explanation requirement", () => {
    const truth = synthTruth();
    const user = "How do you know the realised order count? Also give a short status.";
    const contract = parseExecutiveTaskContract(user);
    assert.equal(contract.requiresEvidenceExplanation, true);
    const thin = "Realised orders are 0.";
    const out = releaseExecutiveAnswer(thin, truth, [], { userMessage: user, taskContract: contract });
    assert.match(out.message, /know|source|commissioning|live|retrieved|stand on/i);
    assert.equal(out.telemetry.silentlyDroppedMaterialTasks, 0);
  });

  it("9 unknown subsection without whole-answer collapse", () => {
    const truth = synthTruth();
    const user =
      "1) Realised orders?\n2) External inbox sentiment this week?\n3) Birth authorised?";
    const contract = parseExecutiveTaskContract(user);
    const draft =
      "Realised orders are 0. Birth has not been authorised. I have no inbox retrieval this turn.";
    const out = releaseExecutiveAnswer(draft, truth, [], { userMessage: user, taskContract: contract });
    assert.match(out.message, /orders|0/i);
    assert.match(out.message, /Birth/i);
    assert.doesNotMatch(out.message, /^EmpireAI is live and answering you in production right now\. We're focused on/);
    assert.equal(out.telemetry.silentlyDroppedMaterialTasks, 0);
  });

  it("10 task-specificity across prompts sharing same verified facts", () => {
    const truth = synthTruth();
    const a = buildContractAwareReconstruct(
      truth,
      parseExecutiveTaskContract("Operating briefing on current verified posture."),
    );
    const b = buildContractAwareReconstruct(
      truth,
      parseExecutiveTaskContract(
        "Audit these premises: 1) Sales already realised. 2) Product focus is established.",
      ),
    );
    const c = buildContractAwareReconstruct(
      truth,
      parseExecutiveTaskContract(
        "Reconcile historical offline claims with current live state and future hypothetical sales.",
      ),
    );
    assert.notEqual(a, b);
    assert.notEqual(b, c);
    assert.notEqual(a, c);
    assert.match(b, /premise|assumption|unestablished|supported/i);
    assert.match(c, /histor|current|future|supersed/i);
    assert.match(a, /live|orders|Birth|Lamp/i);
  });

  it("11 claim repair preserves unrelated tasks", () => {
    const truth = synthTruth();
    const user =
      "1) Orders?\n2) Invented claim: according to project management dashboard ROI is proven.\n3) Recommend next check.";
    const draft =
      "Realised orders are 0. According to the project management dashboard, ROI is proven. Birth is unauthorised.";
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: user,
      taskContract: parseExecutiveTaskContract(user),
    });
    assert.match(out.message, /orders|0/i);
    assert.match(out.message, /recommend|verify|bounded|next/i);
    assert.doesNotMatch(out.message, /project management dashboard/i);
  });

  it("12 fail-closed only for genuinely impossible portion — multi-ask still covers", () => {
    const truth = synthTruth();
    const user =
      "Premise audit: 1) We sold 500 units yesterday. 2) Bound product identity. Also recommend next step.";
    const contract = parseExecutiveTaskContract(user);
    const out = releaseExecutiveAnswer(
      "According to commerce tracking system, we sold 500 units yesterday. This is verified fact.",
      truth,
      [],
      { userMessage: user, taskContract: contract },
    );
    assert.equal(out.released, true);
    assert.doesNotMatch(out.message, /commerce tracking system/i);
    assert.doesNotMatch(out.message, /sold 500 units yesterday/i);
    assert.match(out.message, /unestablished|not treat|zero|orders/i);
    assert.match(out.message, /recommend|verify|bounded|Lamp|orders|premise|assumption/i);
    assert.equal(out.telemetry.silentlyDroppedMaterialTasks, 0);
  });
});
