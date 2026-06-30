import assert from "node:assert/strict";
import path from "node:path";
import { after, before, describe, test } from "node:test";

import {
  DEFAULT_OBJECTIVE_TITLE,
  SUGGESTED_NEXT_OBJECTIVE,
} from "../../objective/criteria.js";
import {
  EXECUTIVE_CONSTITUTIONAL_LAWS,
  PROPOSAL_INITIAL_STATUS,
} from "../../objective/constitution.js";
import {
  createImplementationProposal,
  mayGenerateCursorWork,
  validateProposalForCursorWork,
  validateRecommendationEvidence,
  validateCostAwareness,
} from "../../objective/proposal-model.js";
import { isScopeExpansion } from "../../objective/constitutional-gates.js";
import {
  AutonomousRuntimeOrchestrator,
} from "../../objective/autonomous-runtime-orchestrator.js";
import {
  startPillow,
  requirePillowObjective,
  requirePillowAutonomousRuntime,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function constitutionalProposal(
  overrides: Partial<Parameters<typeof createImplementationProposal>[0]> = {},
) {
  return createImplementationProposal({
    title: "Finish PILLOW-019",
    reason: "Complete objective engine validation",
    businessValue: "Version 1 completion",
    profitImpact: "Enables go-live revenue path",
    repositoryImpact: "Objective module validation only",
    estimatedEngineeringTime: "2 hours",
    estimatedOpenAiCost: "$0.50",
    infrastructureCost: "None incremental",
    opportunityCost: "Low — focused validation",
    expectedRoi: "2.5",
    risk: "Low",
    objectiveAlignment: "Finish EmpireAI Version 1",
    evidence: ["Journey lists PILLOW-019 as active objective work"],
    assumptions: ["Grand King approves validation scope"],
    confidenceLevel: "High",
    alternatives: ["Defer non-blocker polish to Improvement Vault"],
    affectedFiles: ["pillow/src/objective/engine.ts"],
    ...overrides,
  });
}

describe("PILLOW-019 Objective-Driven Autonomous Runtime Orchestrator", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Only one active objective exists", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowObjective();
    const objective = engine.getActiveObjective();
    assert.equal(objective.title, DEFAULT_OBJECTIVE_TITLE);
    assert.equal(engine.getActiveObjective().objectiveId, objective.objectiveId);
    assert.equal(engine.getState().activeObjectiveId, objective.objectiveId);
  });

  test("Non-objective ideas go to ImprovementVault", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowObjective();
    const beforeCount = engine.getVault().summaryCount();
    const result = engine.routeToVault({
      title: "UX redesign for dashboard aesthetics",
      summary: "Endless UX redesign suggestions for post-launch polish",
      tags: ["ux redesign"],
    });
    assert.equal(result.storedInVault, true);
    assert.ok(result.vaultEntryId);
    assert.equal(engine.getVault().summaryCount(), beforeCount + 1);
  });

  test("Builder Mode blocks unrelated suggestions", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const runtime = requirePillowAutonomousRuntime();
    const { proceed, evaluation } = runtime.prepareForExecution({
      title: "Commercial launch expansion",
      summary: "Start commercial automation before Version 1 is complete",
    });
    assert.equal(proceed, false);
    assert.equal(evaluation.supportsObjective, false);
    assert.equal(evaluation.storedInVault, true);
  });

  test("Cursor dispatch is blocked for unrelated work", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const runtime = requirePillowAutonomousRuntime();
    const allowed = runtime.shouldDispatchToCursor({
      title: "Architecture expansion for Version 2",
      summary: "Expand architecture beyond Version 1 scope",
    });
    assert.equal(allowed, false);
  });

  test("Objective-aligned work can proceed to approval", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const runtime = requirePillowAutonomousRuntime();
    const { proceed, evaluation } = runtime.prepareForExecution({
      title: "Complete PILLOW-019 validation",
      summary: "Finish EmpireAI Version 1 objective engine validation",
      missionId: "PILLOW-019",
    });
    assert.equal(proceed, true);
    assert.equal(evaluation.alignment, "objective_aligned");
    assert.equal(runtime.shouldShowApprovalToGrandKing({
      title: "PILLOW-019 validation gate",
      summary: "Version 1 blocker requiring Grand King approval",
      missionId: "PILLOW-019",
    }), true);
  });

  test("Deferred improvements do not interrupt Grand King", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowObjective();
    const evaluation = engine.gateAction({
      title: "Endless doctrine suggestions",
      summary: "New governance doctrine improvements unrelated to V1",
    });
    assert.equal(evaluation.interruptGrandKing, false);
    assert.equal(evaluation.storedInVault, true);
    assert.equal(evaluation.supportsObjective, false);
    assert.equal(engine.getVault().listForReview(false, false).length, 0);
  });

  test("Vault entries receive passive-thinking categories", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowObjective();
    const entry = engine.getVault().store({
      title: "UX polish for dashboard",
      summary: "Aesthetic dashboard improvements after launch",
      tags: ["ux"],
    });
    assert.equal(entry.category, "ux_improvement");
  });

  test("Objective progress can be queried", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowObjective();
    const dashboard = engine.getDashboardState();
    assert.equal(dashboard.currentObjective.title, DEFAULT_OBJECTIVE_TITLE);
    assert.equal(dashboard.activeMode, "builder");
    assert.ok(dashboard.progressPercent >= 0 && dashboard.progressPercent <= 100);
    assert.ok(Array.isArray(dashboard.blockers));
    assert.ok(dashboard.builderModeRules.length >= 5);
    assert.match(dashboard.builderModeRules[0] ?? "", /net profit/i);
    assert.equal(typeof dashboard.deferredImprovementCount, "number");
    assert.equal(dashboard.constitutionalLawsVersion, "V1-complete");
    assert.ok(dashboard.empireScore.overall >= 0 && dashboard.empireScore.overall <= 100);
    assert.equal(dashboard.empireScore.guidesPrioritizationOnly, true);
    assert.ok(dashboard.empireScore.components.length === 6);
    assert.ok(dashboard.primaryAttentionAction);
  });

  test("Executive constitutional laws are defined", () => {
    assert.equal(EXECUTIVE_CONSTITUTIONAL_LAWS.law1_truthAboveAgreement.id, "LAW-1");
    assert.equal(EXECUTIVE_CONSTITUTIONAL_LAWS.law7_empireScore.id, "LAW-7");
  });

  test("Constitution supreme directive is canonical", () => {
    assert.match(
      EXECUTIVE_CONSTITUTIONAL_LAWS.law2_evidenceBeforeRecommendation.summary,
      /evidence/i,
    );
  });

  test("Proposal model blocks Cursor work until Grand King approval", () => {
    const proposal = constitutionalProposal();
    assert.equal(proposal.status, PROPOSAL_INITIAL_STATUS);
    assert.equal(mayGenerateCursorWork(proposal), false);

    const approved = { ...proposal, status: "approved" as const };
    assert.equal(mayGenerateCursorWork(approved), true);
  });

  test("Law 2 rejects recommendations without evidence", () => {
    const proposal = constitutionalProposal({ evidence: [] });
    const result = validateRecommendationEvidence(proposal);
    assert.equal(result.valid, false);
    assert.ok(result.missingFields.includes("evidence"));
  });

  test("Law 3 rejects poor ROI proposals", () => {
    const proposal = constitutionalProposal({ expectedRoi: "0.2" });
    const result = validateCostAwareness(proposal);
    assert.equal(result.poorRoi, true);
    assert.equal(result.valid, false);
  });

  test("Law 4 detects scope expansion", () => {
    assert.equal(
      isScopeExpansion({
        title: "New architecture expansion",
        summary: "Expand architecture beyond Version 1",
      }),
      true,
    );
  });

  test("Law 4 scope expansion deferred in Builder Mode", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowObjective();
    const evaluation = engine.gateAction({
      title: "New governance doctrine",
      summary: "Add new governance expansion unrelated to blockers",
    });
    assert.equal(evaluation.storedInVault, true);
    assert.match(evaluation.reason ?? "", /Finish Before Expand/i);
  });

  test("Law 6 strategic silence suppresses non-material interruptions", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowObjective();
    const evaluation = engine.gateAction({
      title: "Endless doctrine suggestions",
      summary: "New governance doctrine improvements unrelated to V1",
    });
    assert.equal(evaluation.strategicSilence, true);
    assert.equal(evaluation.interruptGrandKing, false);
  });

  test("Empire Score computes six components", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowObjective();
    const score = engine.getEmpireScore();
    assert.ok(score.overall >= 0 && score.overall <= 100);
    assert.equal(score.components.length, 6);
    assert.equal(score.guidesPrioritizationOnly, true);
  });

  test("Cursor sovereignty prohibitions are declared at runtime", () => {
    const prohibitions = AutonomousRuntimeOrchestrator.cursorSovereigntyProhibitions();
    assert.ok(prohibitions.some((rule) => /dispatch work to Cursor/i.test(rule)));
    assert.ok(prohibitions.some((rule) => /autonomously/i.test(rule)));
  });

  test("Incomplete proposals cannot generate Cursor work even when approved", () => {
    const incomplete = createImplementationProposal({
      title: "",
      reason: "",
      businessValue: "",
      profitImpact: "",
      repositoryImpact: "",
      status: "approved",
    });
    const result = validateProposalForCursorWork(incomplete);
    assert.equal(result.approved, true);
    assert.equal(result.valid, false);
    assert.ok(result.missingFields.length > 0);
  });

  test("Objective cannot switch without Grand King approval", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowObjective();
    const denied = engine.requestObjectiveSwitch(SUGGESTED_NEXT_OBJECTIVE, false);
    assert.equal(denied.switched, false);
    assert.match(denied.reason, /Grand King approval/i);

    for (const criterion of engine.getActiveObjective().successCriteria) {
      engine.setCriterionComplete(criterion.id, true);
    }
    const stillDenied = engine.requestObjectiveSwitch(SUGGESTED_NEXT_OBJECTIVE, false);
    assert.equal(stillDenied.switched, false);

    const approved = engine.requestObjectiveSwitch(SUGGESTED_NEXT_OBJECTIVE, true);
    assert.equal(approved.switched, true);
    assert.equal(engine.getActiveObjective().title, SUGGESTED_NEXT_OBJECTIVE);
  });
});
