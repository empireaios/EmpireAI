import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  OPTIMIZATION_DOMAIN_IDS,
  OPTIMIZATION_EKLS_KINDS,
  OPTIMIZATION_TYPES,
  GRAND_KING_CONTINUOUS_INTELLIGENCE_OPTIMIZATION_VERSION,
  approveOptimization,
  buildCockpitContinuousIntelligenceView,
  buildExecutiveOptimizationDashboard,
  computeOptimizationRoi,
  createGrandKingContinuousIntelligenceOptimizationModuleContract,
  deriveSignalFromRuleRef,
  detectOptimizationAnomalies,
  detectOptimizationOpportunities,
  executeOptimization,
  generateOptimizationRecommendations,
  getExecutiveOptimizationSummary,
  getOptimizationOperationsOverview,
  getOptimizationStatus,
  grandKingContinuousIntelligenceOptimizationTools,
  initializeContinuousIntelligenceOptimization,
  isValidOptimizationTransition,
  listContinuousIntelligencePlugins,
  listContinuousIntelligenceRegistryIds,
  listOptimizationRecommendations,
  prioritiseOptimizationRecommendations,
  redactOptimizationSecrets,
  registerContinuousIntelligencePlugin,
  resetGrandKingContinuousIntelligenceOptimizationHarnessForTests,
  resolveOptimizationDependencies,
  runAllDomainOptimisers,
  searchOptimizationEklsObservations,
  validateContinuousIntelligencePillowGovernance,
  listOptimizationEklsKinds,
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
}

async function seedContinuousIntelligence() {
  await seedProductionStack();
  return initializeContinuousIntelligenceOptimization({ workspaceId: CANONICAL_WORKSPACE_ID });
}

describe("G7-06 — Grand King Continuous Intelligence & Optimization", () => {
  it("exposes continuous intelligence framework version and domains", () => {
    assert.equal(GRAND_KING_CONTINUOUS_INTELLIGENCE_OPTIMIZATION_VERSION, "g7-06-v1");
    assert.equal(OPTIMIZATION_DOMAIN_IDS.length, 12);
    assert.equal(OPTIMIZATION_TYPES.length, 11);
  });

  it("registers grand-king-continuous-intelligence-optimization Brain module contract", () => {
    const contract = createGrandKingContinuousIntelligenceOptimizationModuleContract();
    assert.equal(contract.moduleId, "grand-king-continuous-intelligence-optimization");
    assert.equal(contract.missionId, "G7-06");
    assert.equal(contract.programmeStatus, "continuous-intelligence-optimization-established");
    assert.ok(contract.integratesWith.includes("cockpit"));
  });

  it("initializes optimization recommendations with full contract fields", async () => {
    const result = await seedContinuousIntelligence();
    assert.ok(result.recommendations.length >= 1);

    for (const rec of result.recommendations) {
      assert.ok(rec.optimizationId);
      assert.equal(rec.workspaceId, CANONICAL_WORKSPACE_ID);
      assert.ok(rec.targetSubsystem);
      assert.ok(rec.optimizationType);
      assert.ok(rec.priority);
      assert.ok(typeof rec.estimatedBenefit === "number");
      assert.ok(typeof rec.estimatedRisk === "number");
      assert.ok(typeof rec.estimatedCost === "number");
      assert.ok(typeof rec.estimatedRevenueImpact === "number");
      assert.ok(rec.recommendedAction);
      assert.ok(rec.approvalRequirement);
      assert.ok(rec.implementationStatus);
      assert.ok(Array.isArray(rec.evidence));
      assert.ok(rec.createdAt);
      assert.ok(rec.updatedAt);
      assert.ok(rec.correlationId);
      assert.ok(rec.governanceState);
    }
  });

  it("detects opportunities and anomalies from registry rules", async () => {
    await seedProductionStack();
    const opportunities = detectOptimizationOpportunities({ workspaceId: CANONICAL_WORKSPACE_ID });
    const anomalies = detectOptimizationAnomalies({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(opportunities.length >= 1);
    for (const opp of opportunities) {
      assert.ok(opp.ruleReference.startsWith("rule:"));
    }
    assert.ok(Array.isArray(anomalies));
  });

  it("runs domain optimisers across commerce, automation, and financial", async () => {
    await seedProductionStack();
    const results = runAllDomainOptimisers({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(results.length, 5);
    for (const result of results) {
      assert.ok(result.domain);
      assert.ok(Array.isArray(result.suggestedActions));
    }
  });

  it("prioritises recommendations and computes ROI", async () => {
    await seedContinuousIntelligence();
    const recommendations = listOptimizationRecommendations();
    const queue = prioritiseOptimizationRecommendations(recommendations);
    const roi = computeOptimizationRoi(recommendations);
    assert.ok(queue.length >= 1);
    assert.equal(queue[0]!.queuePosition, 1);
    assert.ok(typeof roi.netRoi === "number");
  });

  it("validates optimization lifecycle transitions", () => {
    assert.equal(isValidOptimizationTransition("detected", "analysing"), true);
    assert.equal(isValidOptimizationTransition("recommended", "approved"), true);
    assert.equal(isValidOptimizationTransition("completed", "detected"), false);
  });

  it("registers all required optimization Brain tools", () => {
    const names = new Set(grandKingContinuousIntelligenceOptimizationTools.map((tool) => tool.name));
    for (const toolName of [
      "optimization_overview",
      "optimization_opportunities",
      "optimization_recommendations",
      "optimization_priority_queue",
      "optimization_roi",
      "optimization_status",
      "optimization_history",
      "optimization_summary",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for continuous intelligence", async () => {
    await seedProductionStack();
    const result = validateContinuousIntelligencePillowGovernance({
      ...TEST_ACTOR,
      operation: "recommend",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.optimizationAuthority, true);
    assert.equal(result.riskPolicy, true);
    assert.equal(result.workspaceAuthority, true);
    assert.equal(result.productionSafety, true);
    assert.equal(result.constitutionalCompliance, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records optimization EKLS observations through Pillow", async () => {
    await seedContinuousIntelligence();
    assert.deepEqual(listOptimizationEklsKinds(), [...OPTIMIZATION_EKLS_KINDS]);

    const search = searchOptimizationEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "optimization_recommended",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit continuous intelligence backend contract", async () => {
    await seedContinuousIntelligence();
    const overview = getOptimizationOperationsOverview({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dashboard = buildExecutiveOptimizationDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const summary = getExecutiveOptimizationSummary({ workspaceId: CANONICAL_WORKSPACE_ID });

    const view = buildCockpitContinuousIntelligenceView({
      overview,
      opportunities: dashboard.opportunities,
      priorityQueue: dashboard.priorityQueue,
      roi: dashboard.roi,
      history: dashboard.history,
      recommendations: dashboard.recommendations,
      executiveOptimizationSummary: summary,
    });

    assert.equal(view.viewId, "cockpit-grand-king-continuous-intelligence-optimization");
    assert.equal(view.dataMode, "optimization");
    assert.equal(view.designLanguage, "g4-cockpit");
    assert.ok(view.recommendations.count >= 1);
  });

  it("lists continuous intelligence registry ids", () => {
    const ids = listContinuousIntelligenceRegistryIds();
    assert.equal(ids.length, 5);
    assert.ok(ids.includes("REG-OPTIMIZATION-POLICY"));
    assert.ok(ids.includes("REG-AUTOMATION-POLICY"));
    assert.ok(ids.includes("REG-COMMERCE-POLICY"));
  });

  it("supports continuous intelligence plugins without modifying core", async () => {
    await seedContinuousIntelligence();
    for (const pluginKind of ["detector", "optimiser", "scheduler", "analyser", "report"] as const) {
      const result = registerContinuousIntelligencePlugin({
        manifest: {
          pluginId: `test-${pluginKind}`,
          pluginName: `Test ${pluginKind}`,
          pluginKind,
          pillowGovernance: true,
        },
        actorId: TEST_ACTOR.actorId,
        workspaceId: CANONICAL_WORKSPACE_ID,
        ownerId: TEST_ACTOR.ownerId,
        pillowGovernance: true,
      });
      assert.equal(result.accepted, true);
    }
    assert.equal(listContinuousIntelligencePlugins().length, 5);
  });

  it("resolves registry-driven optimization signals", () => {
    const signal = deriveSignalFromRuleRef("rule:commerce-throughput");
    assert.ok(signal > 0 && signal < 1);
    const deps = resolveOptimizationDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(deps.opportunityRuleRefs.length >= 1);
    assert.ok(deps.domainRefs.length >= 12);
  });

  it("approves and executes optimizations through Pillow governance", async () => {
    await seedContinuousIntelligence();
    const rec = listOptimizationRecommendations().find((r) => r.implementationStatus === "recommended");
    assert.ok(rec);

    const scheduled = approveOptimization({
      ...TEST_ACTOR,
      optimizationId: rec!.optimizationId,
    });
    assert.equal(scheduled.implementationStatus, "scheduled");

    const completed = executeOptimization({
      ...TEST_ACTOR,
      optimizationId: rec!.optimizationId,
    });
    assert.equal(completed.implementationStatus, "completed");
  });

  it("generates registry-driven recommendations from G7 stack", async () => {
    await seedProductionStack();
    const recommendations = generateOptimizationRecommendations({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(recommendations.length >= 1);
    for (const rec of recommendations) {
      assert.ok(rec.evidence[0]?.ref?.startsWith("rule:"));
    }
  });

  it("redacts secrets from optimization output", async () => {
    await seedContinuousIntelligence();
    const status = getOptimizationStatus({ workspaceId: CANONICAL_WORKSPACE_ID });
    const redacted = redactOptimizationSecrets({ status, secret: "sk_live_abc", token: "api_key_xyz" });
    const serialized = JSON.stringify(redacted);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("[REDACTED]"), true);
  });

  it("does not expose credentials in optimization output", async () => {
    await seedContinuousIntelligence();
    const dashboard = buildExecutiveOptimizationDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const serialized = JSON.stringify(dashboard);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
  });
});
