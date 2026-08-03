import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildDecisionEngineConfiguration,
  createDecisionEngine,
  DE_CAPABILITIES,
  EVALUATION_CRITERIA,
  resetDecisionEngineForTesting,
} from "../../decision-engine/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createDecisionEngine(bootstrap);
  await engine.initialize();
  engine.connectDecisionEngine();
  return engine;
}

describe("Q0-05 Decision Engine", () => {
  beforeEach(resetDecisionEngineForTesting);

  test("1 locks mandatory decision boundaries", () => {
    const c = buildDecisionEngineConfiguration(REPO_ROOT, {
      neverExecuteWork: false as never,
      neverAssignWorkers: false as never,
      neverApproveActions: false as never,
      neverOverridePillow: false as never,
      neverReplaceGrandKingApproval: false as never,
    });
    assert.equal(c.neverExecuteWork, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverApproveActions, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverReplaceGrandKingApproval, true);
  });

  test("2 initializes PILLOW-DE-001 for Q0-05", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-05");
    assert.equal(state.engineVersion, "PILLOW-DE-001");
    for (const criterion of EVALUATION_CRITERIA) {
      assert.ok(state.configuration.evaluationCriteria.includes(criterion));
    }
  });

  test("3 receives an executive problem and generates multiple options", async () => {
    const report = (await build()).submitProblem({
      executiveObjective: "Expand into a regulated adjacent market while controlling cost and compliance risk",
      validated: true,
    });
    assert.equal(report.validation.decision, "pass");
    const pkg = report.packages[0]!;
    assert.ok(pkg.candidateOptions.length >= 3);
    assert.ok(pkg.decisionId.startsWith("de-dec-"));
  });

  test("4 scores every option and produces a trade-off matrix", async () => {
    const pkg = (await build()).evaluateOptions({
      executiveObjective: "Scale enterprise operations under governance with budget discipline",
      validated: true,
      riskHints: ["regulatory delay"],
    }).packages[0]!;
    assert.equal(pkg.evaluationMatrix.length, pkg.candidateOptions.length);
    for (const row of pkg.evaluationMatrix) {
      assert.ok(row.scores.length >= EVALUATION_CRITERIA.length);
      assert.ok(row.weightedTotal > 0);
    }
    assert.ok(pkg.tradeOffAnalysis.comparisons.length > 0);
    assert.ok(pkg.tradeOffAnalysis.summary.length > 0);
  });

  test("5 recommends the best option with confidence and rationale", async () => {
    const pkg = (await build()).produceDecisionPackage({
      executiveObjective: "Launch a pilot before full market expansion to reduce downside risk",
      validated: true,
      evidenceHints: ["structural://market_gap"],
    }).packages[0]!;
    assert.ok(pkg.recommendedOption.optionId);
    assert.ok(pkg.recommendedOption.rationale.toLowerCase().includes("recommended"));
    assert.ok(pkg.confidenceScore >= 0 && pkg.confidenceScore <= 100);
    assert.ok(pkg.candidateOptions.some((o) => o.optionId === pkg.recommendedOption.optionId));
    assert.equal(pkg.metadataVersion, "DE-001-v1");
  });

  test("6 identifies risks, assumptions, and missing information", async () => {
    const pkg = (await build()).submitProblem({
      executiveObjective: "Partner to accelerate delivery while preserving strategic control",
      validated: true,
      assumptionHints: ["Partner capacity is available"],
      missingInfoHints: ["Contract templates"],
      riskHints: ["Vendor lock-in"],
    }).packages[0]!;
    assert.ok(pkg.riskAssessment.includes("Vendor lock-in"));
    assert.ok(pkg.assumptions.includes("Partner capacity is available"));
    assert.ok(pkg.missingInformation.includes("Contract templates"));
    assert.ok(pkg.supportingEvidence.length > 0);
  });

  test("7 rejects execute / assign / approve / override / Grand King boundary violations", async () => {
    const engine = await build();
    const objective = "Select best path for portfolio expansion under governance";
    assert.equal(engine.submitProblem({ executiveObjective: objective, validated: true, executeWork: true }).validation.decision, "fail");
    assert.equal(engine.submitProblem({ executiveObjective: objective, validated: true, assignWorkers: true }).validation.decision, "fail");
    assert.equal(engine.submitProblem({ executiveObjective: objective, validated: true, approveActions: true }).validation.decision, "fail");
    assert.equal(engine.submitProblem({ executiveObjective: objective, validated: true, overridePillow: true }).validation.decision, "fail");
    assert.equal(
      engine.submitProblem({ executiveObjective: objective, validated: true, replaceGrandKingApproval: true }).validation.decision,
      "fail",
    );
  });

  test("8 rejects empty or unvalidated problems", async () => {
    const engine = await build();
    assert.equal(engine.submitProblem({ executiveObjective: "", validated: true }).validation.decision, "fail");
    assert.equal(
      engine.submitProblem({
        executiveObjective: "Choose a course of action for market entry",
        validated: false,
      }).validation.decision,
      "fail",
    );
  });

  test("9 returns machine-readable packages with extensible criteria support", async () => {
    const engine = createDecisionEngine(await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }), {
      configuration: { evaluationCriteria: [...EVALUATION_CRITERIA, "dependency_load"] },
    });
    await engine.initialize();
    engine.connectDecisionEngine();
    const pkg = engine.produceDecisionPackage({
      executiveObjective: "Reduce delivery risk by evaluating dependency-sensitive alternatives",
      validated: true,
      criteriaHints: ["dependency_load"],
    }).packages[0]!;
    assert.ok(pkg.decisionTraceId.startsWith("de-trace-"));
    assert.equal(pkg.workExecuted, false);
    assert.equal(pkg.actionsApproved, false);
    assert.equal(pkg.grandKingApprovalReplaced, false);
    assert.ok(pkg.evaluationMatrix[0]!.scores.some((s) => s.criterionId === "dependency_load"));
    assert.ok(DE_CAPABILITIES.includes("extensible_evaluation_criteria"));
  });

  test("10 validates stored decision packages", async () => {
    const engine = await build();
    engine.submitProblem({
      executiveObjective: "Recommend the best path for cost-controlled product expansion",
      validated: true,
    });
    const validation = engine.validateDecision({ executiveObjective: "", validated: true });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.equal(engine.getPackages().length, 1);
    assert.equal(engine.getLatestPackage()?.neverExecuteWork, true);
  });
});
