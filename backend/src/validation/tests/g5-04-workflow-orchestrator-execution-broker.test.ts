import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { OrchestratorDispatchRequest } from "../../brain/types.js";
import {
  advanceAutomationRun,
  dispatchNextQueuedAutomation,
  dispatchToWorkflowScheduler,
  getAutomationQueue,
  getAutomationRecoveryStatus,
  getAutomationRunStatus,
  listOrchestratorAuditEvents,
  orchestratorPluginRegistry,
  pickupWaitingAutomation,
  previewWorkflowDefinition,
  resetBusinessAutomationHarnessForTests,
  resolveExecutorBinding,
  resolveWorkflowDefinition,
  runAutomationToCompletion,
  setAutomationBrainDispatch,
  topologicalSort,
  validateWorkflowDependencies,
} from "../../orchestration/business-automation/index.js";
import {
  resetAutomationRegistryBatchForTests,
  resetRegistryLoaderForTests,
} from "../../registry/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

function resetG504Harness(): void {
  resetRegistryLoaderForTests();
  resetAutomationRegistryBatchForTests();
  resetBusinessAutomationHarnessForTests();
}

function seedWaitingQueueEntry(workspaceId: string, correlationId: string): string {
  const request = dispatchToWorkflowScheduler(
    {
      triggerContext: {
        triggerId: "trg-foundation-decision-gate",
        source: "manual_executive",
        workspaceId,
        environment: "validation",
        registryReferences: {
          triggerId: "trg-foundation-decision-gate",
          triggerVersion: "1.0.0",
          workflowId: "wf-foundation-decision-orchestration",
          workflowVersion: "1.0.0",
          policyId: "pol-foundation-default",
        },
        timestamp: new Date().toISOString(),
        priority: "normal",
        correlationId,
        approvalState: "not_required",
      },
      workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
      registryRefs: {
        triggerId: "trg-foundation-decision-gate",
        triggerVersion: "1.0.0",
        workflowId: "wf-foundation-decision-orchestration",
        workflowVersion: "1.0.0",
        policyId: "pol-foundation-default",
      },
      approvalRouting: { required: false, approvalState: "not_required", reason: "ok" },
      correlationId,
    },
    { actorId: "actor_g504" },
  );

  return request.queueId!;
}

async function promoteToWaiting(queueId: string): Promise<void> {
  await dispatchNextQueuedAutomation({});
  const entry = getAutomationQueue().getById(queueId);
  assert.ok(entry);
  assert.equal(entry.executionState, "waiting");
}

describe("G5-04 — Workflow Orchestrator & Execution Broker", () => {
  it("loads workflow definition from REG-AUTOMATION-WORKFLOW without hardcoded sequences", () => {
    resetG504Harness();
    const workflow = previewWorkflowDefinition({
      workflowId: "wf-foundation-decision-orchestration",
      workflowVersion: "1.0.0",
      policyRegistryId: "pol-foundation-default",
      recoveryRegistryId: "rec-foundation-default",
    });

    assert.equal(workflow.workflowId, "wf-foundation-decision-orchestration");
    assert.equal(workflow.policyRegistryId, "pol-foundation-default");
    assert.equal(workflow.recoveryRegistryId, "rec-foundation-default");
    assert.ok(workflow.steps.length >= 4);
    assert.deepEqual(workflow.executionOrder[0], "refresh-intelligence");
    validateWorkflowDependencies(workflow);
  });

  it("topologically sorts workflow dependencies from registry steps", () => {
    resetG504Harness();
    const workflow = resolveWorkflowDefinition({
      workflowId: "wf-foundation-decision-orchestration",
      workflowVersion: "1.0.0",
    });
    const order = topologicalSort(workflow.steps);
    assert.deepEqual(order, workflow.executionOrder);
    assert.ok(order.indexOf("validate-decision") > order.indexOf("refresh-intelligence"));
    assert.ok(order.indexOf("execute-approved-action") > order.indexOf("validate-decision"));
  });

  it("resolves business engine executor bindings from REG-AUTOMATION-EXECUTOR", () => {
    resetG504Harness();
    const binding = resolveExecutorBinding({
      stepId: "marketplace-list",
      executorType: "business_engine",
      executorRef: "marketplace-infrastructure-engine:list",
      dependsOn: [],
    });

    assert.equal(binding.module, "marketplace-infrastructure-engine");
    assert.equal(binding.action, "list");
    assert.equal(binding.executorRegistryId, "exec-foundation-marketplace-engine");
    assert.ok(binding.capabilityTags.includes("marketplace"));
  });

  it("pickups waiting queue entry and creates execution context", async () => {
    resetG504Harness();
    const queueId = seedWaitingQueueEntry("ws_g504_pickup", "corr-pickup");
    await promoteToWaiting(queueId);

    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g504",
      workspaceId: "ws_g504_pickup",
      queueId,
    });

    assert.ok(pickup.executionId);
    assert.equal(pickup.queueId, queueId);
    assert.equal(pickup.lifecycleState, "execution_started");

    const status = getAutomationRunStatus(pickup.executionId);
    assert.equal(status.found, true);
    assert.equal(status.workflowId, "wf-foundation-decision-orchestration");
    assert.equal(status.correlationId, "corr-pickup");
    assert.equal(getAutomationQueue().getById(queueId)?.executionState, "running");
  });

  it("dispatches executable steps only through Brain via Execution Broker", async () => {
    resetG504Harness();
    const dispatches: OrchestratorDispatchRequest[] = [];
    setAutomationBrainDispatch(async (request) => {
      dispatches.push(request);
      return {
        correlationId: request.correlationId ?? "mock",
        status: "completed",
        result: { acknowledged: true },
      };
    });

    const queueId = seedWaitingQueueEntry("ws_g504_broker", "corr-broker");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g504",
      workspaceId: "ws_g504_broker",
      queueId,
    });

    const result = await runAutomationToCompletion({
      actorId: "actor_g504",
      workspaceId: "ws_g504_broker",
      executionId: pickup.executionId,
    });

    assert.equal(result.lifecycleState, "workflow_completed");
    assert.ok(dispatches.length >= 3);
    assert.ok(dispatches.some((item) => item.module === "executive-intelligence-orchestrator"));
    assert.ok(dispatches.some((item) => item.module === "decision-gate"));
    assert.ok(dispatches.some((item) => item.module === "execution-broker"));
    assert.ok(dispatches.every((item) => item.payload.automationRun === true));
  });

  it("records orchestrator audit events through Pillow EKLS governance", async () => {
    resetG504Harness();
    setAutomationBrainDispatch(async (request) => ({
      correlationId: request.correlationId ?? "mock",
      status: "completed",
      result: { ok: true },
    }));

    const queueId = seedWaitingQueueEntry("ws_g504_audit", "corr-audit");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g504",
      workspaceId: "ws_g504_audit",
      queueId,
    });

    await advanceAutomationRun({
      actorId: "actor_g504",
      workspaceId: "ws_g504_audit",
      executionId: pickup.executionId,
    });

    const events = listOrchestratorAuditEvents("ws_g504_audit");
    assert.ok(events.some((event) => event.eventType === "workflow_execution"));
    assert.ok(events.some((event) => event.eventType === "step_completion"));
    assert.equal(events.every((event) => event.pillowGovernance === true), true);
  });

  it("routes foundation executor refs to Brain module:action targets from registry", async () => {
    resetG504Harness();
    const dispatches: OrchestratorDispatchRequest[] = [];
    setAutomationBrainDispatch(async (request) => {
      dispatches.push(request);
      return {
        correlationId: request.correlationId ?? "mock",
        status: "completed",
        result: { acknowledged: true },
      };
    });

    const queueId = seedWaitingQueueEntry("ws_g504_routes", "corr-routes");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g504",
      workspaceId: "ws_g504_routes",
      queueId,
    });

    await advanceAutomationRun({
      actorId: "actor_g504",
      workspaceId: "ws_g504_routes",
      executionId: pickup.executionId,
    });

    assert.equal(dispatches[0]?.module, "executive-intelligence-orchestrator");
    assert.equal(dispatches[0]?.action, "load");
    assert.equal(dispatches[0]?.payload.pillowGovernance, true);
  });

  it("supports plugin execution validators without modifying orchestrator core", async () => {
    resetG504Harness();
    orchestratorPluginRegistry.registerValidator({
      pluginId: "block-refresh",
      validate: ({ step }) => ({
        valid: step.stepId !== "refresh-intelligence",
        reason: "Plugin blocked refresh-intelligence",
      }),
    });

    setAutomationBrainDispatch(async (request) => ({
      correlationId: request.correlationId ?? "mock",
      status: "completed",
      result: { ok: true },
    }));

    const queueId = seedWaitingQueueEntry("ws_g504_plugin", "corr-plugin");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g504",
      workspaceId: "ws_g504_plugin",
      queueId,
    });

    const result = await advanceAutomationRun({
      actorId: "actor_g504",
      workspaceId: "ws_g504_plugin",
      executionId: pickup.executionId,
    });

    const recovery = getAutomationRecoveryStatus(pickup.executionId);
    assert.equal(recovery.found, true);
    assert.equal(recovery.recoveryState, "escalated");
    assert.notEqual(result.lifecycleState, "workflow_completed");
    assert.ok(
      listOrchestratorAuditEvents("ws_g504_plugin").some(
        (event) => event.eventType === "failure_event",
      ),
    );
  });

  it("dispatches business engine steps through Brain without embedding engine logic", async () => {
    resetG504Harness();
    const dispatches: OrchestratorDispatchRequest[] = [];
    setAutomationBrainDispatch(async (request) => {
      dispatches.push(request);
      return {
        correlationId: request.correlationId ?? "mock",
        status: "completed",
        result: { items: [] },
      };
    });

    const binding = resolveExecutorBinding({
      stepId: "list-marketplaces",
      executorType: "business_engine",
      executorRef: "marketplace-infrastructure-engine:list",
      dependsOn: [],
    });

    const broker = (await import("../../orchestration/business-automation/broker/execution-broker.js"))
      .getExecutionBroker();
    const run = {
      executionId: "exec-test",
      queueId: "queue-test",
      lifecycleState: "step_executing" as const,
      executionContext: {
        executionId: "exec-test",
        workflowId: "wf-test",
        workflowVersion: "1.0.0",
        triggerId: "trg-test",
        queueId: "queue-test",
        workspaceId: "ws_g504_engine",
        environment: "validation",
        correlationId: "corr-engine",
        executionState: "step_executing" as const,
        registryReferences: {
          triggerId: "trg-test",
          triggerVersion: "1.0.0",
          workflowId: "wf-test",
          workflowVersion: "1.0.0",
        },
        pillowGovernance: true as const,
      },
      workflow: {
        workflowId: "wf-test",
        workflowVersion: "1.0.0",
        name: "test",
        description: "test",
        purpose: "test",
        steps: [],
        executionOrder: [],
        notificationRegistryIds: [],
        reportRegistryIds: [],
      },
      steps: [],
      completedStepIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pillowGovernance: true as const,
    };

    const stepResult = await broker.executeStep({
      run,
      step: {
        stepId: "list-marketplaces",
        executorType: "business_engine",
        executorRef: binding.executorRef,
        dependsOn: [],
      },
      actorId: "actor_g504",
    });

    assert.equal(stepResult.success, true);
    assert.equal(dispatches.length, 1);
    assert.equal(dispatches[0]?.module, "marketplace-infrastructure-engine");
    assert.equal(dispatches[0]?.action, "list");
  });
});
