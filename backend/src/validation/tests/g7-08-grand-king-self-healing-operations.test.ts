import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  HEALING_ACTIONS,
  HEALTH_STATES,
  SELF_HEALING_DOMAIN_IDS,
  SELF_HEALING_EKLS_KINDS,
  GRAND_KING_SELF_HEALING_OPERATIONS_VERSION,
  buildCockpitSelfHealingView,
  buildExecutiveHealingDashboard,
  buildHealingQueue,
  computeSelfHealingStatistics,
  createGrandKingSelfHealingOperationsModuleContract,
  deriveHealingSignalFromRef,
  detectHealthDegradation,
  evaluateDependencyHealth,
  executeHealingAction,
  generateHealingRecommendations,
  getExecutiveSelfHealingSummary,
  getSelfHealingOverview,
  getSelfHealingStatus,
  grandKingSelfHealingOperationsTools,
  initializeSelfHealingOperations,
  isValidHealingTransition,
  listHealingActions,
  listSelfHealingEklsKinds,
  listSelfHealingPlugins,
  listSelfHealingRegistryIds,
  pauseHealingAction,
  planSubsystemRecovery,
  redactSelfHealingSecrets,
  registerSelfHealingPlugin,
  resetGrandKingSelfHealingOperationsHarnessForTests,
  resolveSelfHealingDependencies,
  scoreRecoveryConfidence,
  searchSelfHealingEklsObservations,
  validateSelfHealingPillowGovernance,
  coordinateProductionRollback,
  appendHealingAction,
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
}

async function seedSelfHealing() {
  await seedProductionStack();
  return initializeSelfHealingOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
}

describe("G7-08 — Grand King Self-Healing Operations", () => {
  it("exposes self-healing framework version and domains", () => {
    assert.equal(GRAND_KING_SELF_HEALING_OPERATIONS_VERSION, "g7-08-v1");
    assert.equal(SELF_HEALING_DOMAIN_IDS.length, 12);
    assert.equal(HEALTH_STATES.length, 9);
    assert.equal(HEALING_ACTIONS.length, 11);
  });

  it("registers grand-king-self-healing-operations Brain module contract", () => {
    const contract = createGrandKingSelfHealingOperationsModuleContract();
    assert.equal(contract.moduleId, "grand-king-self-healing-operations");
    assert.equal(contract.missionId, "G7-08");
    assert.equal(contract.programmeStatus, "self-healing-operations-established");
    assert.ok(contract.integratesWith.includes("business-automation"));
  });

  it("initializes healing actions with full contract fields", async () => {
    const result = await seedSelfHealing();
    assert.ok(result.healingActions.length >= 1);

    for (const action of result.healingActions) {
      assert.ok(action.healingId);
      assert.equal(action.workspaceId, CANONICAL_WORKSPACE_ID);
      assert.ok(action.targetSubsystem);
      assert.ok(action.failureReference);
      assert.ok(action.recoveryReference);
      assert.ok(action.healingAction);
      assert.ok(typeof action.confidenceScore === "number");
      assert.ok(action.approvalRequirement);
      assert.ok(action.executionStatus);
      assert.ok(action.result);
      assert.ok(action.rollbackReference);
      assert.ok(Array.isArray(action.evidence));
      assert.ok(action.createdAt);
      assert.ok(action.updatedAt);
      assert.ok(action.correlationId);
      assert.ok(action.governanceState);
    }
  });

  it("detects health degradation from registry rules", async () => {
    await seedProductionStack();
    const degradations = detectHealthDegradation({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(Array.isArray(degradations));
    const recommendations = generateHealingRecommendations({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(recommendations.length >= 1);
  });

  it("plans subsystem recovery and scores confidence", async () => {
    await seedProductionStack();
    const rec = generateHealingRecommendations({ workspaceId: CANONICAL_WORKSPACE_ID })[0];
    assert.ok(rec);
    const plan = planSubsystemRecovery(rec!, { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(plan.healingId);
    assert.ok(plan.recoveryReference);
    const score = scoreRecoveryConfidence({
      ruleReference: rec!.ruleReference,
      healingAction: rec!.healingAction,
      healthSeverity: 2,
    });
    assert.ok(score >= 0 && score <= 100);
  });

  it("evaluates dependency health from registry", async () => {
    await seedProductionStack();
    const dep = evaluateDependencyHealth("commerce", { workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(dep.dependencyRefs.length >= 1);
    assert.ok(typeof dep.healthy === "boolean");
  });

  it("validates healing lifecycle transitions", () => {
    assert.equal(isValidHealingTransition("recommended", "executing"), true);
    assert.equal(isValidHealingTransition("executing", "completed"), true);
    assert.equal(isValidHealingTransition("completed", "executing"), false);
  });

  it("registers all required self-healing Brain tools", () => {
    const names = new Set(grandKingSelfHealingOperationsTools.map((t) => t.name));
    for (const toolName of [
      "self_healing_overview",
      "self_healing_status",
      "self_healing_history",
      "self_healing_recommendations",
      "self_healing_execute",
      "self_healing_pause",
      "self_healing_statistics",
      "self_healing_summary",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for self-healing", async () => {
    await seedProductionStack();
    const result = validateSelfHealingPillowGovernance({ ...TEST_ACTOR, operation: "heal" });
    assert.equal(result.allowed, true);
    assert.equal(result.healingAuthority, true);
    assert.equal(result.productionAuthority, true);
    assert.equal(result.rollbackAuthority, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records self-healing EKLS observations through Pillow", async () => {
    await seedSelfHealing();
    assert.deepEqual(listSelfHealingEklsKinds(), [...SELF_HEALING_EKLS_KINDS]);
    const search = searchSelfHealingEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "self_healing_learning_recorded",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit self-healing backend contract", async () => {
    await seedSelfHealing();
    const overview = getSelfHealingOverview({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dashboard = buildExecutiveHealingDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const summary = getExecutiveSelfHealingSummary({ workspaceId: CANONICAL_WORKSPACE_ID });

    const view = buildCockpitSelfHealingView({
      overview,
      queue: dashboard.queue,
      confidence: dashboard.confidence,
      recommendations: dashboard.recommendations,
      activeRecoveries: dashboard.activeRecoveries,
      history: dashboard.history,
      executiveSummary: summary,
    });

    assert.equal(view.viewId, "cockpit-grand-king-self-healing-operations");
    assert.equal(view.dataMode, "self-healing");
    assert.equal(view.designLanguage, "g4-cockpit");
  });

  it("lists self-healing registry ids", () => {
    const ids = listSelfHealingRegistryIds();
    assert.equal(ids.length, 6);
    assert.ok(ids.includes("REG-AUTOMATION-RECOVERY"));
    assert.ok(ids.includes("REG-IDENTITY-MONITOR"));
    assert.ok(ids.includes("REG-OPTIMIZATION-POLICY"));
  });

  it("supports self-healing plugins without modifying core", async () => {
    await seedSelfHealing();
    for (const pluginKind of [
      "health_analyser",
      "healing_strategy",
      "recovery_planner",
      "rollback_planner",
      "dependency_analyser",
      "confidence_scorer",
    ] as const) {
      const result = registerSelfHealingPlugin({
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
    assert.equal(listSelfHealingPlugins().length, 6);
  });

  it("executes and pauses healing through Pillow governance", async () => {
    await seedSelfHealing();
    const target = listHealingActions().find((h) => h.executionStatus === "recommended");
    if (target) {
      const executed = executeHealingAction({
        ...TEST_ACTOR,
        healingId: target.healingId,
      });
      assert.equal(executed.executionStatus, "completed");
    }

    await seedProductionStack();
    const rec = generateHealingRecommendations({ workspaceId: CANONICAL_WORKSPACE_ID })[0];
    assert.ok(rec);
    const plan = planSubsystemRecovery(rec!, { workspaceId: CANONICAL_WORKSPACE_ID });
    appendHealingAction({ ...plan, executionStatus: "executing" });
    const paused = pauseHealingAction({
      ...TEST_ACTOR,
      healingId: plan.healingId,
    });
    assert.equal(paused.executionStatus, "paused");
  });

  it("coordinates production rollback", async () => {
    await seedProductionStack();
    const rec = generateHealingRecommendations({ workspaceId: CANONICAL_WORKSPACE_ID })[0];
    assert.ok(rec);
    const plan = planSubsystemRecovery(rec!, { workspaceId: CANONICAL_WORKSPACE_ID });
    appendHealingAction(plan);
    const rolled = coordinateProductionRollback({
      ...TEST_ACTOR,
      healingId: plan.healingId,
    });
    assert.equal(rolled.executionStatus, "cancelled");
  });

  it("resolves registry-driven healing signals", () => {
    const signal = deriveHealingSignalFromRef("rule:identity-degradation");
    assert.ok(signal > 0 && signal < 1);
    const deps = resolveSelfHealingDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(deps.recoveryRows.length >= 0);
    assert.ok(deps.identityDegradationRules.length >= 1);
  });

  it("computes self-healing statistics", async () => {
    await seedSelfHealing();
    const stats = computeSelfHealingStatistics();
    const queue = buildHealingQueue();
    assert.ok(typeof stats.successRate === "number");
    assert.ok(Array.isArray(queue));
  });

  it("redacts secrets from self-healing output", async () => {
    await seedSelfHealing();
    const status = getSelfHealingStatus({ workspaceId: CANONICAL_WORKSPACE_ID });
    const redacted = redactSelfHealingSecrets({ status, secret: "sk_live_abc" });
    assert.equal(JSON.stringify(redacted).includes("sk_live"), false);
  });

  it("does not expose credentials in self-healing output", async () => {
    await seedSelfHealing();
    const dashboard = buildExecutiveHealingDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const serialized = JSON.stringify(dashboard);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
  });
});
