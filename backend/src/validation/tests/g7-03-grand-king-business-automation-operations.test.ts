import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTOMATION_OPERATION_DOMAIN_IDS,
  AUTOMATION_OPERATION_STATES,
  AUTOMATION_OPERATIONS_EKLS_KINDS,
  GRAND_KING_BUSINESS_AUTOMATION_OPERATIONS_VERSION,
  buildCockpitAutomationOperationsView,
  cancelAutomationOperation,
  createGrandKingBusinessAutomationOperationsModuleContract,
  getAutomationOperationDependencies,
  getAutomationOperationHealth,
  getAutomationOperationSummary,
  getAutomationOperationsOverview,
  getExecutiveAutomationDashboard,
  grandKingBusinessAutomationOperationsTools,
  initializeAutomationOperations,
  isValidAutomationOperationTransition,
  listAutomationOperationsEklsKinds,
  listAutomationOperationsPlugins,
  listAutomationOperationsRegistryIds,
  pauseAutomationOperation,
  registerAutomationOperationsPlugin,
  resetGrandKingBusinessAutomationOperationsHarnessForTests,
  resolveAutomationOperationDomains,
  resumeAutomationOperation,
  searchAutomationOperationsEklsObservations,
  startAutomationOperation,
  validateAutomationOperationsPillowGovernance,
  validateAutomationReadiness,
} from "../../orchestration/grand-king-business-automation-operations/index.js";
import { initializeCommerceOperations, resetGrandKingCommerceOperationsHarnessForTests } from "../../orchestration/grand-king-commerce-operations/index.js";
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
}

async function seedAutomationOperations() {
  await seedProductionStack();
  return initializeAutomationOperations({ workspaceId: CANONICAL_WORKSPACE_ID });
}

describe("G7-03 — Grand King Business Automation Operations", () => {
  it("exposes automation operations framework version and states", () => {
    assert.equal(GRAND_KING_BUSINESS_AUTOMATION_OPERATIONS_VERSION, "g7-03-v1");
    assert.ok(AUTOMATION_OPERATION_STATES.includes("executing"));
    assert.ok(AUTOMATION_OPERATION_STATES.includes("approval_pending"));
    assert.equal(AUTOMATION_OPERATION_STATES.length, 11);
    assert.equal(AUTOMATION_OPERATION_DOMAIN_IDS.length, 10);
  });

  it("registers grand-king-business-automation-operations Brain module contract", () => {
    const contract = createGrandKingBusinessAutomationOperationsModuleContract();
    assert.equal(contract.moduleId, "grand-king-business-automation-operations");
    assert.equal(contract.missionId, "G7-03");
    assert.equal(contract.programmeStatus, "business-automation-operations-established");
    assert.ok(contract.capabilities.includes("grand-king-business-automation-operations.start"));
  });

  it("resolves ten automation domains from registry map", async () => {
    await seedProductionStack();
    const domains = resolveAutomationOperationDomains();
    assert.equal(domains.length, 10);
    assert.ok(domains.some((d) => d.domainId === "trigger_engine"));
    assert.ok(domains.some((d) => d.domainId === "workflow_orchestrator"));
    assert.ok(domains.some((d) => d.domainId === "executive_monitoring"));
  });

  it("initializes automation operations with full contract fields", async () => {
    const run = await seedAutomationOperations();
    assert.equal(run.operations.length, 10);
    for (const op of run.operations) {
      assert.ok(op.automationOperationId);
      assert.ok(op.workflowId);
      assert.equal(op.workspaceId, CANONICAL_WORKSPACE_ID);
      assert.equal(op.brandId, "brand-luminousyou");
      assert.ok(op.triggerId);
      assert.ok(op.queueId);
      assert.ok(op.approvalId);
      assert.ok(op.recoveryId);
      assert.ok(op.executionStatus);
      assert.ok(op.healthStatus);
      assert.ok(op.readinessReference);
      assert.ok(Array.isArray(op.evidence));
      assert.ok(Array.isArray(op.risks));
      assert.ok(Array.isArray(op.blockers));
      assert.ok(op.startedAt);
      assert.ok(op.correlationId);
      assert.ok(op.governanceState);
      assert.ok(op.domainId);
      assert.ok(op.domainName);
    }
  });

  it("validates automation readiness from G6 through G7-02 stack", async () => {
    await seedProductionStack();
    const readiness = validateAutomationReadiness({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(readiness.ready, true);
    assert.equal(readiness.productionEligible, true);
  });

  it("blocks automation readiness when governance signal active", async () => {
    await seedProductionStack();
    process.env.AUTOMATION_READINESS_BLOCKED = "true";
    const readiness = validateAutomationReadiness({ workspaceId: CANONICAL_WORKSPACE_ID });
    assert.equal(readiness.ready, false);
  });

  it("validates automation operation lifecycle transitions", () => {
    assert.equal(isValidAutomationOperationTransition("ready", "executing"), true);
    assert.equal(isValidAutomationOperationTransition("executing", "paused"), true);
    assert.equal(isValidAutomationOperationTransition("executing", "cancelled"), true);
    assert.equal(isValidAutomationOperationTransition("completed", "executing"), false);
  });

  it("supports start, pause, resume, and cancel lifecycle", async () => {
    const run = await seedAutomationOperations();
    const target = run.operations.find((op) => op.executionStatus === "ready");
    assert.ok(target);

    const started = startAutomationOperation({
      ...TEST_ACTOR,
      automationOperationId: target!.automationOperationId,
    });
    assert.equal(started.executionStatus, "executing");
    assert.ok(started.workflowRunId);

    const paused = pauseAutomationOperation({
      ...TEST_ACTOR,
      automationOperationId: target!.automationOperationId,
    });
    assert.equal(paused.executionStatus, "paused");

    const resumed = resumeAutomationOperation({
      ...TEST_ACTOR,
      automationOperationId: target!.automationOperationId,
    });
    assert.equal(resumed.executionStatus, "executing");

    const cancelled = cancelAutomationOperation({
      ...TEST_ACTOR,
      automationOperationId: target!.automationOperationId,
    });
    assert.equal(cancelled.executionStatus, "cancelled");
  });

  it("registers all required automation operations Brain tools", () => {
    const names = new Set(grandKingBusinessAutomationOperationsTools.map((tool) => tool.name));
    for (const toolName of [
      "automation_operations_overview",
      "automation_operation_status",
      "start_automation_operation",
      "pause_automation_operation",
      "resume_automation_operation",
      "cancel_automation_operation",
      "automation_operation_health",
      "automation_operation_dependencies",
      "automation_operation_summary",
    ]) {
      assert.equal(names.has(toolName), true, `Missing Brain tool: ${toolName}`);
    }
  });

  it("passes Pillow governance for automation operations", async () => {
    await seedProductionStack();
    const result = validateAutomationOperationsPillowGovernance({
      ...TEST_ACTOR,
      operation: "start",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.workflowAuthority, true);
    assert.equal(result.executionAuthority, true);
    assert.equal(result.approvalAuthority, true);
    assert.equal(result.recoveryAuthority, true);
    assert.equal(result.workspaceAuthority, true);
    assert.equal(result.productionAuthority, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records automation operation EKLS observations through Pillow", async () => {
    const run = await seedAutomationOperations();
    assert.deepEqual(listAutomationOperationsEklsKinds(), [...AUTOMATION_OPERATIONS_EKLS_KINDS]);
    const target = run.operations.find((op) => op.executionStatus === "ready");
    assert.ok(target);

    startAutomationOperation({ ...TEST_ACTOR, automationOperationId: target!.automationOperationId });

    const search = searchAutomationOperationsEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: CANONICAL_WORKSPACE_ID,
      kind: "automation_operation_started",
      pillowGovernance: true,
    });
    assert.ok(search.length >= 1);
  });

  it("exposes Cockpit automation operations backend contract", async () => {
    const run = await seedAutomationOperations();
    const overview = getAutomationOperationsOverview({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dependencies = getAutomationOperationDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    const dashboard = getExecutiveAutomationDashboard({ workspaceId: CANONICAL_WORKSPACE_ID });
    const summary = getAutomationOperationSummary({ workspaceId: CANONICAL_WORKSPACE_ID });

    const view = buildCockpitAutomationOperationsView({
      overview,
      ...dashboard,
      dependencies,
      executiveSummary: summary,
    });

    assert.equal(view.viewId, "cockpit-grand-king-business-automation-operations");
    assert.equal(view.dataMode, "live");
    assert.equal(view.automationOperations.operationCount, 10);
    assert.ok(view.workflowQueue);
    assert.ok(view.activeExecutions);
    assert.ok(view.approvals);
    assert.ok(view.recoveries);
  });

  it("lists automation operations registry ids", () => {
    const ids = listAutomationOperationsRegistryIds();
    assert.equal(ids.length, 6);
    assert.ok(ids.includes("REG-AUTOMATION-WORKFLOW"));
    assert.ok(ids.includes("REG-AUTOMATION-POLICY"));
    assert.ok(ids.includes("REG-AUTOMATION-EXECUTOR"));
    assert.ok(ids.includes("REG-AUTOMATION-APPROVAL"));
    assert.ok(ids.includes("REG-AUTOMATION-RECOVERY"));
    assert.ok(ids.includes("REG-READINESS-POLICY"));
  });

  it("supports automation operations plugins without modifying core", async () => {
    await seedAutomationOperations();
    for (const pluginKind of ["workflow", "trigger", "approval", "recovery", "monitoring"] as const) {
      const result = registerAutomationOperationsPlugin({
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
    assert.equal(listAutomationOperationsPlugins().length, 5);
  });

  it("evaluates automation operation health and workflow monitoring", async () => {
    const run = await seedAutomationOperations();
    const target = run.operations.find((op) => op.executionStatus === "ready");
    assert.ok(target);
    startAutomationOperation({ ...TEST_ACTOR, automationOperationId: target!.automationOperationId });
    const health = getAutomationOperationHealth(target!.automationOperationId);
    assert.equal(health.healthy, true);
    assert.ok(health.score >= 70);

    const dashboard = getExecutiveAutomationDashboard();
    assert.equal(dashboard.activeExecutions.executingCount, 1);
  });

  it("does not expose credentials or secrets in automation operation output", async () => {
    const run = await seedAutomationOperations();
    const dependencies = getAutomationOperationDependencies({ workspaceId: CANONICAL_WORKSPACE_ID });
    const serialized = JSON.stringify({ run, dependencies });
    assert.equal(serialized.includes("sk_live"), false);
    assert.equal(serialized.includes("api_key"), false);
    assert.equal(serialized.includes("password"), false);
    assert.equal(serialized.includes("secret"), false);
    assert.equal(serialized.includes("token"), false);
  });
});
