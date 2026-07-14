import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTONOMOUS_DOMAIN_IDS,
  AUTONOMOUS_EKLS_KINDS,
  AUTONOMY_LEVELS,
  GRAND_KING_AUTONOMOUS_OPERATIONS_VERSION,
  buildAutonomousQueue,
  buildCockpitAutonomousOperationsView,
  buildExecutiveAutonomyDashboard,
  cancelAutonomousOperation,
  createGrandKingAutonomousOperationsModuleContract,
  deriveAutonomySignalFromRef,
  evaluateAllAutonomyPolicies,
  evaluateAutonomyApproval,
  getAutonomousOperationStatus,
  getAutonomousOperationsOverview,
  getExecutiveAutonomySummary,
  grandKingAutonomousOperationsTools,
  initializeAutonomousOperations,
  isValidAutonomousTransition,
  listAutonomousEklsKinds,
  listAutonomousOperationsPlugins,
  listAutonomousOperationsRegistryIds,
  listAutonomousOperations,
  monitorAutonomousOperations,
  pauseAutonomousOperation,
  redactAutonomousSecrets,
  registerAutonomousOperationsPlugin,
  resetGrandKingAutonomousOperationsHarnessForTests,
  resolveAutonomousOperationDependencies,
  resumeAutonomousOperation,
  routeAutonomousDecisions,
  searchAutonomousEklsObservations,
  validateAutonomousOperationsPillowGovernance,
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
}

async function seedAutonomousOperations() {
  await seedProductionStack();
  return initializeAutonomousOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
}

describe("G7-07 — Grand King Autonomous Operations", () => {
  it("exposes autonomous operations framework version and domains", () => {
    assert.equal(GRAND_KING_AUTONOMOUS_OPERATIONS_VERSION, "g7-07-v1");
    assert.equal(AUTONOMOUS_DOMAIN_IDS.length, 10);
    assert.equal(AUTONOMY_LEVELS.length, 6);
  });

  it("registers grand-king-autonomous-operations Brain module contract", () => {
    const contract = createGrandKingAutonomousOperationsModuleContract();
    assert.equal(contract.moduleId, "grand-king-autonomous-operations");
    assert.equal(contract.missionId, "G7-07");
    assert.equal(contract.programmeStatus, "autonomous-operations-established");
    assert.ok(contract.integratesWith.includes("cockpit"));
  });

  it("initializes autonomous operations with full contract fields", async () => {
    const result = await seedAutonomousOperations();
    assert.ok(result.operations.length >= 1);

    for (const op of result.operations) {
      assert.ok(op.autonomousOperationId);
      assert.equal(op.workspaceId, CANONICAL_WORKSPACE_ID);
      assert.ok(op.brandId);
      assert.ok(op.operationType);
      assert.ok(op.autonomyLevel);
      assert.ok(op.approvalPolicy);
      assert.ok(op.executionStatus);
      assert.ok(op.healthStatus);
      assert.ok(typeof op.riskScore === "number");
      assert.ok(typeof op.estimatedImpact === "number");
      assert.ok(op.recommendedAction);
      assert.ok(op.rollbackReference);
      assert.ok(Array.isArray(op.evidence));
      assert.ok(op.createdAt);
      assert.ok(op.updatedAt);
      assert.ok(op.correlationId);
      assert.ok(op.governanceState);
    }
  });

  it("evaluates autonomy policies from registry refs", async () => {
    await seedProductionStack();
    const policies = evaluateAllAutonomyPolicies({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(policies.length, 10);
    for (const policy of policies) {
      assert.ok(policy.policyReference);
      assert.ok(policy.riskThresholdRef);
    }
  });

  it("evaluates approval routing by autonomy level", () => {
    const manual = evaluateAutonomyApproval({ autonomyLevel: "manual_only", riskScore: 10 });
    assert.equal(manual.requiresApproval, true);
    const autonomous = evaluateAutonomyApproval({ autonomyLevel: "fully_autonomous", riskScore: 10 });
    assert.equal(autonomous.requiresApproval, false);
    const highRisk = evaluateAutonomyApproval({ autonomyLevel: "semi_autonomous", riskScore: 75 });
    assert.equal(highRisk.requiresApproval, true);
  });

  it("routes autonomous decisions from G7 stack", async () => {
    await seedProductionStack();
    const decisions = routeAutonomousDecisions({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(decisions.length >= 1);
    for (const rec of decisions) {
      assert.ok(rec.ruleReference);
    }
  });

  it("validates autonomous lifecycle transitions", () => {
    assert.equal(isValidAutonomousTransition("waiting", "scheduled"), true);
    assert.equal(isValidAutonomousTransition("running", "completed"), true);
    assert.equal(isValidAutonomousTransition("completed", "running"), false);
  });

  it("registers all required autonomous Brain tools", () => {
    const names = new Set(grandKingAutonomousOperationsTools.map((tool) => tool.name));
    for (const toolName of [
      "autonomous_operations_overview",
      "autonomous_operation_status",
      "autonomous_operation_queue",
      "autonomous_operation_history",
      "autonomous_operation_health",
      "autonomous_operation_pause",
      "autonomous_operation_resume",
      "autonomous_operation_cancel",
      "autonomous_operation_summary",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for autonomous operations", async () => {
    await seedProductionStack();
    const result = validateAutonomousOperationsPillowGovernance({
      ...TEST_ACTOR,
      operation: "execute",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.autonomyEligibility, true);
    assert.equal(result.riskPolicy, true);
    assert.equal(result.productionAuthority, true);
    assert.equal(result.workspaceAuthority, true);
    assert.equal(result.rollbackEligibility, false);
    assert.equal(result.eklsGoverned, true);
  });

  it("records autonomous EKLS observations through Pillow", async () => {
    await seedAutonomousOperations();
    assert.deepEqual(listAutonomousEklsKinds(), [...AUTONOMOUS_EKLS_KINDS]);

    const search = searchAutonomousEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "autonomous_learning_recorded",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit autonomous operations backend contract", async () => {
    await seedAutonomousOperations();
    const overview = getAutonomousOperationsOverview({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dashboard = buildExecutiveAutonomyDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const summary = getExecutiveAutonomySummary({ workspaceId: CANONICAL_WORKSPACE_ID });

    const view = buildCockpitAutonomousOperationsView({
      overview,
      queue: dashboard.queue,
      health: dashboard.health,
      recommendations: dashboard.recommendations,
      history: dashboard.history,
      operations: dashboard.operations,
      executiveSummary: summary,
    });

    assert.equal(view.viewId, "cockpit-grand-king-autonomous-operations");
    assert.equal(view.dataMode, "autonomous");
    assert.equal(view.designLanguage, "g4-cockpit");
    assert.ok(view.autonomousQueue.count >= 0);
  });

  it("lists autonomous operations registry ids", () => {
    const ids = listAutonomousOperationsRegistryIds();
    assert.equal(ids.length, 6);
    assert.ok(ids.includes("REG-AUTOMATION-POLICY"));
    assert.ok(ids.includes("REG-READINESS-POLICY"));
    assert.ok(ids.includes("REG-OPTIMIZATION-POLICY"));
  });

  it("supports autonomous operations plugins without modifying core", async () => {
    await seedAutonomousOperations();
    for (const pluginKind of ["executor", "scheduler", "validator", "monitor", "analyser"] as const) {
      const result = registerAutonomousOperationsPlugin({
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
    assert.equal(listAutonomousOperationsPlugins().length, 5);
  });

  it("monitors autonomous health and builds queue", async () => {
    await seedAutonomousOperations();
    const health = monitorAutonomousOperations();
    const queue = buildAutonomousQueue();
    assert.ok(["healthy", "degraded", "critical", "unknown"].includes(health.overallHealth));
    assert.ok(Array.isArray(queue));
  });

  it("pauses, resumes, and cancels operations through Pillow", async () => {
    await seedAutonomousOperations();
    let target = listAutonomousOperations().find((op) =>
      ["scheduled", "running"].includes(op.executionStatus),
    );
    if (!target) {
      const pending = listAutonomousOperations().find((op) => op.executionStatus === "approval_pending");
      assert.ok(pending);
      target = resumeAutonomousOperation({
        ...TEST_ACTOR,
        autonomousOperationId: pending!.autonomousOperationId,
      });
    }
    assert.ok(target);

    const paused = pauseAutonomousOperation({
      ...TEST_ACTOR,
      autonomousOperationId: target!.autonomousOperationId,
    });
    assert.equal(paused.executionStatus, "paused");

    const resumed = resumeAutonomousOperation({
      ...TEST_ACTOR,
      autonomousOperationId: target!.autonomousOperationId,
    });
    assert.ok(["running", "scheduled"].includes(resumed.executionStatus));

    const cancelled = cancelAutonomousOperation({
      ...TEST_ACTOR,
      autonomousOperationId: target!.autonomousOperationId,
    });
    assert.ok(["cancelled", "recovered"].includes(cancelled.executionStatus));
  });

  it("resolves registry-driven autonomy signals", () => {
    const signal = deriveAutonomySignalFromRef("rule:commerce-throughput");
    assert.ok(signal > 0 && signal < 1);
    const deps = resolveAutonomousOperationDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.ok(deps.readinessSignals.length >= 0);
    assert.ok(deps.automationPolicies >= 0);
  });

  it("redacts secrets from autonomous output", async () => {
    await seedAutonomousOperations();
    const status = getAutonomousOperationStatus({ workspaceId: CANONICAL_WORKSPACE_ID });
    const redacted = redactAutonomousSecrets({ status, secret: "sk_live_abc", token: "api_key_xyz" });
    const serialized = JSON.stringify(redacted);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("[REDACTED]"), true);
  });

  it("does not expose credentials in autonomous output", async () => {
    await seedAutonomousOperations();
    const dashboard = buildExecutiveAutonomyDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const serialized = JSON.stringify(dashboard);
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
  });
});
