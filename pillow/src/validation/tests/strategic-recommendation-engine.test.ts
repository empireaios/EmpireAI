import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  REC_CAPABILITIES,
  RECOMMENDATION_CATEGORIES,
  PRIORITY_LEVELS,
  buildStrategicRecommendationEngineConfiguration,
  createStrategicRecommendationEngine,
  resetStrategicRecommendationEngineForTesting,
} from "../../strategic-recommendation-engine/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const RICH_INPUT = {
  empireStateHints: ["Empire posture is stable but drift risk exists"],
  activeBusinessHints: ["Active portfolio growing; one idle business needs attention"],
  businessPerformanceHints: ["Revenue growth uneven; margin pressure in one corridor"],
  workforcePerformanceHints: ["Backlog forming around manual handoffs"],
  infrastructureHints: ["Capacity limit approaching on core platform"],
  bottleneckHints: ["Manual approval lag constrains throughput"],
  opportunityHints: ["Adjacent market expansion signal detected"],
  riskHints: ["Security exposure on high-consequence paths", "Compliance risk rising"],
  evidenceHints: ["structural://empire_state_snapshot"],
  validated: true as const,
};

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createStrategicRecommendationEngine(bootstrap);
  await engine.initialize();
  engine.connectStrategicRecommendationEngine();
  return engine;
}

describe("Q0-07 Strategic Recommendation Engine", () => {
  beforeEach(resetStrategicRecommendationEngineForTesting);

  test("1 locks mandatory recommendation boundaries", () => {
    const c = buildStrategicRecommendationEngineConfiguration(REPO_ROOT, {
      neverExecuteRecommendations: false as never,
      neverAssignWorkers: false as never,
      neverApproveActions: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteRecommendations, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverApproveActions, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
  });

  test("2 initializes PILLOW-REC-001 for Q0-07", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-07");
    assert.equal(state.engineVersion, "PILLOW-REC-001");
    for (const category of RECOMMENDATION_CATEGORIES) {
      assert.ok(state.configuration.recommendationCategories.includes(category));
    }
    assert.ok(PRIORITY_LEVELS.includes("critical"));
  });

  test("3 analyses current EmpireAI state across required dimensions", async () => {
    const report = (await build()).analyseState(RICH_INPUT);
    assert.equal(report.validation.decision, "pass");
    const analysis = report.analysis!;
    assert.ok(analysis.analysisId.startsWith("rec-anl-"));
    assert.ok(analysis.dimensions.length >= 6);
    const ids = analysis.dimensions.map((d) => d.dimensionId);
    assert.ok(ids.includes("empire_state"));
    assert.ok(ids.includes("active_businesses"));
    assert.ok(ids.includes("business_performance"));
    assert.ok(ids.includes("workforce_performance"));
    assert.ok(ids.includes("infrastructure"));
    assert.ok(ids.includes("operational_bottlenecks"));
    assert.ok(analysis.opportunitiesDetected.length > 0);
    assert.ok(analysis.risksDetected.length > 0);
  });

  test("4 generates multiple ranked strategic recommendations", async () => {
    const report = (await build()).generateRecommendations(RICH_INPUT);
    assert.ok(report.recommendations.length >= 3);
    for (let i = 1; i < report.recommendations.length; i += 1) {
      assert.ok(report.recommendations[i - 1]!.rankScore >= report.recommendations[i]!.rankScore);
    }
  });

  test("5 produces machine-readable packages with rationale", async () => {
    const pkg = (await build()).producePackages(RICH_INPUT).recommendations[0]!;
    assert.ok(pkg.recommendationId.startsWith("rec-pkg-"));
    assert.ok(pkg.recommendationTitle.length > 0);
    assert.ok(pkg.executiveSummary.length > 0);
    assert.ok(pkg.rationale.toLowerCase().includes("recommended"));
    assert.ok(pkg.confidenceScore >= 0 && pkg.confidenceScore <= 100);
    assert.equal(pkg.metadataVersion, "REC-001-v1");
    assert.ok(pkg.supportingEvidence.length > 0);
    assert.ok(pkg.riskAssessment.length > 0);
  });

  test("6 explains business impact, value, cost, and approval requirement", async () => {
    const pkg = (await build()).rankRecommendations(RICH_INPUT).recommendations[0]!;
    assert.ok(pkg.businessImpact.length > 0);
    assert.ok(pkg.strategicValue > 0);
    assert.ok(pkg.estimatedBenefit.length > 0);
    assert.ok(pkg.estimatedCost.length > 0);
    assert.ok(pkg.approvalRequirement);
    assert.ok(PRIORITY_LEVELS.includes(pkg.priority));
  });

  test("7 rejects execute / assign / approve / override boundary violations", async () => {
    const engine = await build();
    assert.equal(
      engine.producePackages({ ...RICH_INPUT, executeRecommendations: true }).validation.decision,
      "fail",
    );
    assert.equal(engine.producePackages({ ...RICH_INPUT, assignWorkers: true }).validation.decision, "fail");
    assert.equal(engine.producePackages({ ...RICH_INPUT, approveActions: true }).validation.decision, "fail");
    assert.equal(engine.producePackages({ ...RICH_INPUT, overridePillow: true }).validation.decision, "fail");
    assert.equal(engine.producePackages({ ...RICH_INPUT, overrideGrandKing: true }).validation.decision, "fail");
  });

  test("8 rejects unvalidated recommendation runs", async () => {
    const report = (await build()).producePackages({ ...RICH_INPUT, validated: false });
    assert.equal(report.validation.decision, "fail");
  });

  test("9 supports extensible categories without redesign", async () => {
    const engine = createStrategicRecommendationEngine(
      await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }),
      { configuration: { recommendationCategories: [...RECOMMENDATION_CATEGORIES, "capital_efficiency"] } },
    );
    await engine.initialize();
    engine.connectStrategicRecommendationEngine();
    const pkg = engine.producePackages({
      ...RICH_INPUT,
      categoryHints: ["capital_efficiency"],
    }).recommendations[0]!;
    assert.ok(pkg.recommendationTraceId.startsWith("rec-trace-"));
    assert.equal(pkg.recommendationExecuted, false);
    assert.equal(pkg.actionsApproved, false);
    assert.ok(REC_CAPABILITIES.includes("extensible_recommendation_categories"));
    assert.ok(
      engine.getState().configuration.recommendationCategories.includes("capital_efficiency"),
    );
  });

  test("10 validates stored recommendation packages", async () => {
    const engine = await build();
    engine.producePackages(RICH_INPUT);
    const validation = engine.validateRecommendations({ validated: true, empireStateHints: ["ok"] });
    assert.ok(validation.validation.decision === "pass" || validation.validation.decision === "partial");
    assert.ok(engine.getRecommendations().length >= 3);
    assert.equal(engine.getRecommendations()[0]?.neverExecuteRecommendations, true);
    assert.ok(engine.getLatestAnalysis()?.summary.length);
  });
});
