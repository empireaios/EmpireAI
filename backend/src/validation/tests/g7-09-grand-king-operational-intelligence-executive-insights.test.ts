import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  EXECUTIVE_KPI_IDS,
  GRAND_KING_OPERATIONAL_INTELLIGENCE_VERSION,
  INSIGHT_TYPES,
  INTELLIGENCE_DOMAIN_IDS,
  OPERATIONAL_INTELLIGENCE_EKLS_KINDS,
  analyseAnomalies,
  analyseOperationalTrends,
  analyseOpportunities,
  buildCockpitOperationalIntelligenceView,
  buildExecutiveIntelligenceDashboard,
  computeEmpireHealthScore,
  computeExecutiveKpiSnapshots,
  createGrandKingOperationalIntelligenceModuleContract,
  deriveIntelligenceSignalFromRef,
  generateExecutiveBriefing,
  generateExecutiveRecommendations,
  generatePredictions,
  getExecutiveIntelligenceSummary,
  getOperationalIntelligenceOverview,
  getOperationalIntelligenceStatus,
  grandKingOperationalIntelligenceTools,
  initializeOperationalIntelligence,
  listOperationalIntelligenceEklsKinds,
  listOperationalIntelligencePlugins,
  listOperationalIntelligenceRegistryIds,
  redactOperationalIntelligenceSecrets,
  registerOperationalIntelligencePlugin,
  resetGrandKingOperationalIntelligenceHarnessForTests,
  resolveOperationalIntelligenceDependencies,
  searchOperationalIntelligenceEklsObservations,
  validateOperationalIntelligencePillowGovernance,
} from "../../orchestration/grand-king-operational-intelligence-executive-insights/index.js";
import {
  initializeSelfHealingOperations,
  resetGrandKingSelfHealingOperationsHarnessForTests,
} from "../../orchestration/grand-king-self-healing-operations/index.js";
import {
  initializeAutonomousOperations,
  resetGrandKingAutonomousOperationsHarnessForTests,
} from "../../orchestration/grand-king-autonomous-operations/index.js";
import {
  initializeContinuousIntelligenceOptimization,
  resetGrandKingContinuousIntelligenceOptimizationHarnessForTests,
} from "../../orchestration/grand-king-continuous-intelligence-optimization/index.js";
import {
  initializeFinancialOperations,
  resetGrandKingRevenueFinancialOperationsHarnessForTests,
} from "../../orchestration/grand-king-revenue-financial-operations/index.js";
import {
  initializeExecutiveDecisionCentre,
  resetGrandKingExecutiveDecisionCentreHarnessForTests,
} from "../../orchestration/grand-king-executive-decision-centre/index.js";
import {
  initializeAutomationOperations,
  resetGrandKingBusinessAutomationOperationsHarnessForTests,
} from "../../orchestration/grand-king-business-automation-operations/index.js";
import {
  initializeCommerceOperations,
  resetGrandKingCommerceOperationsHarnessForTests,
} from "../../orchestration/grand-king-commerce-operations/index.js";
import { resetGrandKingLiveOperationsHarnessForTests } from "../../orchestration/grand-king-live-operations/index.js";
import {
  activateGrandKingProductionWorkspace,
  createGrandKingProductionWorkspace,
  resetGrandKingProductionWorkspaceHarnessForTests,
} from "../../orchestration/grand-king-production-workspace/index.js";
import {
  resetProductionCertificationHarnessForTests,
  runFinalProductionReadinessCertification,
} from "../../orchestration/production-certification/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const CANONICAL_WORKSPACE_ID = "ws_empire_1";

const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: CANONICAL_WORKSPACE_ID,
  ownerId: "grand-king",
  pillowGovernance: true as const,
};

async function seedProductionStack(): Promise<void> {
  resetProductionCertificationHarnessForTests();
  resetGrandKingLiveOperationsHarnessForTests();
  resetGrandKingProductionWorkspaceHarnessForTests();
  resetGrandKingCommerceOperationsHarnessForTests();
  resetGrandKingBusinessAutomationOperationsHarnessForTests();
  resetGrandKingExecutiveDecisionCentreHarnessForTests();
  resetGrandKingRevenueFinancialOperationsHarnessForTests();
  resetGrandKingContinuousIntelligenceOptimizationHarnessForTests();
  resetGrandKingAutonomousOperationsHarnessForTests();
  resetGrandKingSelfHealingOperationsHarnessForTests();
  resetGrandKingOperationalIntelligenceHarnessForTests();
  process.env.LIVE_OPS_PRODUCTION_NOT_ELIGIBLE = "false";
  await runFinalProductionReadinessCertification({
    context: { workspaceId: "ws-foundation" },
    actorId: TEST_ACTOR.actorId,
    workspaceId: "ws-foundation",
    pillowGovernance: true,
  });
  createGrandKingProductionWorkspace({
    context: { workspaceId: CANONICAL_WORKSPACE_ID },
    actorId: TEST_ACTOR.actorId,
    ownerId: TEST_ACTOR.ownerId,
    pillowGovernance: true,
  });
  activateGrandKingProductionWorkspace({
    actorId: TEST_ACTOR.actorId,
    ownerId: TEST_ACTOR.ownerId,
    pillowGovernance: true,
  });
  initializeCommerceOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeAutomationOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeExecutiveDecisionCentre({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeFinancialOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeContinuousIntelligenceOptimization({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeAutonomousOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
  initializeSelfHealingOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
}

async function seedOperationalIntelligence() {
  await seedProductionStack();
  return initializeOperationalIntelligence({ workspaceId: CANONICAL_WORKSPACE_ID });
}

describe("G7-09 — Grand King Operational Intelligence & Executive Insights", () => {
  it("exposes operational intelligence framework version and domains", () => {
    assert.equal(GRAND_KING_OPERATIONAL_INTELLIGENCE_VERSION, "g7-09-v1");
    assert.equal(INTELLIGENCE_DOMAIN_IDS.length, 15);
    assert.equal(INSIGHT_TYPES.length, 11);
    assert.equal(EXECUTIVE_KPI_IDS.length, 13);
  });

  it("registers grand-king-operational-intelligence-executive-insights Brain module contract", () => {
    const contract = createGrandKingOperationalIntelligenceModuleContract();
    assert.equal(contract.moduleId, "grand-king-operational-intelligence-executive-insights");
    assert.equal(contract.missionId, "G7-09");
    assert.equal(contract.programmeStatus, "operational-intelligence-executive-insights-established");
    assert.ok(contract.integratesWith.includes("grand-king-self-healing-operations"));
  });

  it("initializes insights with full contract fields", async () => {
    const result = await seedOperationalIntelligence();
    assert.ok(result.insights.length >= 1);

    for (const insight of result.insights) {
      assert.ok(insight.insightId);
      assert.equal(insight.workspaceId, CANONICAL_WORKSPACE_ID);
      assert.ok(insight.category);
      assert.ok(insight.severity);
      assert.ok(insight.priority);
      assert.ok(Array.isArray(insight.sourceSubsystems));
      assert.ok(typeof insight.confidenceScore === "number");
      assert.ok(typeof insight.businessImpact === "number");
      assert.ok(typeof insight.financialImpact === "number");
      assert.ok(insight.recommendedAction);
      assert.ok(insight.predictedOutcome);
      assert.ok(Array.isArray(insight.supportingEvidence));
      assert.ok(insight.createdAt);
      assert.ok(insight.updatedAt);
      assert.ok(insight.correlationId);
      assert.ok(insight.governanceState);
    }
  });

  it("generates predictions from registry rules", async () => {
    await seedProductionStack();
    const predictions = generatePredictions({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(predictions.length >= 1);
    for (const pred of predictions) {
      assert.ok(pred.predictionId);
      assert.ok(pred.ruleReference);
      assert.ok(typeof pred.confidenceScore === "number");
    }
  });

  it("analyses operational trends from registry", async () => {
    await seedProductionStack();
    const trends = analyseOperationalTrends({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(trends.length >= 1);
    for (const trend of trends) {
      assert.ok(["up", "down", "stable"].includes(trend.direction));
    }
  });

  it("generates executive recommendations from registry", async () => {
    await seedProductionStack();
    const recommendations = generateExecutiveRecommendations({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(recommendations.length >= 1);
    for (const rec of recommendations) {
      assert.equal(rec.category, "recommendation");
      assert.ok(rec.recommendedAction);
    }
  });

  it("registers all required operational intelligence Brain tools", () => {
    const names = new Set(grandKingOperationalIntelligenceTools.map((t) => t.name));
    for (const toolName of [
      "executive_intelligence",
      "executive_insights",
      "executive_predictions",
      "executive_trends",
      "executive_opportunities",
      "executive_risks",
      "executive_briefing",
      "empire_health_score",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for operational intelligence", async () => {
    await seedProductionStack();
    const result = validateOperationalIntelligencePillowGovernance({ ...TEST_ACTOR, operation: "insight" });
    assert.equal(result.allowed, true);
    assert.equal(result.insightAuthority, true);
    assert.equal(result.recommendationAuthority, true);
    assert.equal(result.evidenceIntegrity, true);
    assert.equal(result.executiveVisibility, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records operational intelligence EKLS observations through Pillow", async () => {
    await seedOperationalIntelligence();
    assert.deepEqual(listOperationalIntelligenceEklsKinds(), [...OPERATIONAL_INTELLIGENCE_EKLS_KINDS]);
    const search = searchOperationalIntelligenceEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "executive_learning_recorded",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit operational intelligence backend contract", async () => {
    await seedOperationalIntelligence();
    const overview = getOperationalIntelligenceOverview({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dashboard = buildExecutiveIntelligenceDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const summary = getExecutiveIntelligenceSummary({ workspaceId: CANONICAL_WORKSPACE_ID });

    const view = buildCockpitOperationalIntelligenceView({
      overview,
      insights: dashboard.insights,
      briefing: dashboard.briefing,
      empireHealth: dashboard.empireHealth,
      trends: dashboard.trends,
      opportunities: dashboard.opportunities,
      risks: dashboard.risks,
      predictions: dashboard.predictions,
      recommendations: dashboard.recommendations,
      executiveSummary: summary,
    });

    assert.equal(view.viewId, "cockpit-grand-king-operational-intelligence-executive-insights");
    assert.equal(view.dataMode, "operational-intelligence");
    assert.equal(view.designLanguage, "g4-cockpit");
    assert.ok(view.executiveIntelligence);
    assert.ok(view.executiveBriefing);
    assert.ok(view.empireHealthScore);
    assert.ok(view.trendDashboard);
    assert.ok(view.opportunityDashboard);
    assert.ok(view.riskDashboard);
    assert.ok(view.predictions);
    assert.ok(view.recommendations);
  });

  it("lists operational intelligence registry ids", () => {
    const ids = listOperationalIntelligenceRegistryIds();
    assert.equal(ids.length, 5);
    assert.ok(ids.includes("REG-EXECUTIVE-POLICY"));
    assert.ok(ids.includes("REG-OPTIMIZATION-POLICY"));
    assert.ok(ids.includes("REG-COMMERCE-POLICY"));
    assert.ok(ids.includes("REG-AUTOMATION-POLICY"));
    assert.ok(ids.includes("REG-READINESS-POLICY"));
  });

  it("supports operational intelligence plugins without modifying core", async () => {
    await seedOperationalIntelligence();
    for (const pluginKind of [
      "insight_provider",
      "prediction_engine",
      "trend_analyser",
      "business_analyser",
      "recommendation_provider",
      "kpi_provider",
    ] as const) {
      const result = registerOperationalIntelligencePlugin({
        manifest: {
          pluginId: `test-${pluginKind}`,
          pluginName: `Test ${pluginKind}`,
          pluginKind,
          pillowGovernance: true,
        },
        ...TEST_ACTOR,
      });
      assert.equal(result.accepted, true);
    }
    assert.equal(listOperationalIntelligencePlugins().length, 6);
  });

  it("computes empire health score and executive KPIs", async () => {
    await seedOperationalIntelligence();
    const empireHealth = computeEmpireHealthScore({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(empireHealth.score >= 0 && empireHealth.score <= 100);
    assert.ok(["A", "B", "C", "D", "F"].includes(empireHealth.grade));
    assert.equal(empireHealth.kpiContributions.length, 13);

    const kpis = computeExecutiveKpiSnapshots({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(kpis.length, 13);
  });

  it("generates executive briefing", async () => {
    await seedOperationalIntelligence();
    const briefing = generateExecutiveBriefing({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(briefing.briefingId);
    assert.ok(briefing.title);
    assert.ok(briefing.summary);
    assert.ok(Array.isArray(briefing.keyInsights));
    assert.ok(typeof briefing.empireHealthScore === "number");
  });

  it("resolves registry-driven intelligence signals", () => {
    const signal = deriveIntelligenceSignalFromRef("kpi:revenue");
    assert.ok(signal > 0 && signal < 1);
    const deps = resolveOperationalIntelligenceDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(deps.kpiMetricRefs.length >= 1);
    assert.ok(deps.decisionRuleRefs.length >= 1);
  });

  it("detects anomalies and opportunities from registry", async () => {
    await seedProductionStack();
    const anomalies = analyseAnomalies({ workspaceId: CANONICAL_WORKSPACE_ID });
    const opportunities = analyseOpportunities({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(anomalies.length >= 1);
    assert.ok(opportunities.length >= 1);
  });

  it("redacts secrets from operational intelligence output", async () => {
    await seedOperationalIntelligence();
    const status = getOperationalIntelligenceStatus({ workspaceId: CANONICAL_WORKSPACE_ID });
    const redacted = redactOperationalIntelligenceSecrets({ status, secret: "sk_live_abc", pii: "customer_ssn" });
    assert.equal(JSON.stringify(redacted).includes("sk_live"), false);
    assert.equal(JSON.stringify(redacted).includes("ssn"), false);
  });

  it("does not expose credentials in operational intelligence output", async () => {
    await seedOperationalIntelligence();
    const dashboard = buildExecutiveIntelligenceDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const serialized = JSON.stringify(dashboard);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("token"), false);
  });
});
