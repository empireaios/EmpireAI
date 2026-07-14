import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  advanceAutomationRun,
  classifyFailureCategory,
  dispatchNextQueuedAutomation,
  dispatchToWorkflowScheduler,
  getAutomationQueue,
  getAutomationRecoveryStatus,
  getAutomationRollbackStatus,
  getAutomationRunStatus,
  getCockpitAutomationRecoveryStatus,
  listGuardianRecoveryEvents,
  listRecoveryAuditEvents,
  pickupWaitingAutomation,
  previewRecoveryStrategy,
  recoveryPluginRegistry,
  resetBusinessAutomationHarnessForTests,
  resolveRecoveryPolicyPreview,
  setAutomationBrainDispatch,
  simulateAutomationFailure,
} from "../../orchestration/business-automation/index.js";
import {
  resetAutomationRegistryBatchForTests,
  resetRegistryLoaderForTests,
} from "../../registry/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

function resetG506Harness(): void {
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
    { actorId: "actor_g506" },
  );

  return request.queueId!;
}

async function promoteToWaiting(queueId: string): Promise<void> {
  await dispatchNextQueuedAutomation({});
  const entry = getAutomationQueue().getById(queueId);
  assert.ok(entry);
  assert.equal(entry.executionState, "waiting");
}

describe("G5-06 — Recovery & Rollback Engine", () => {
  it("resolves recovery strategies from REG-AUTOMATION-RECOVERY without hardcoded paths", () => {
    resetG506Harness();
    const policy = resolveRecoveryPolicyPreview({
      recoveryRegistryId: "rec-foundation-default",
      policyRegistryId: "pol-foundation-default",
    });

    assert.equal(policy.recoveryRegistryId, "rec-foundation-default");
    assert.equal(policy.maxAttempts, 3);
    assert.ok(policy.strategies.some((strategy) => strategy.kind === "retry"));
    assert.ok(policy.strategies.some((strategy) => strategy.kind === "rollback"));
    assert.equal(policy.rollbackMap["execute-approved-action"], "compensate-action");
  });

  it("selects registry recovery strategies by condition expressions", () => {
    resetG506Harness();
    const retryPreview = previewRecoveryStrategy({
      recoveryRegistryId: "rec-foundation-default",
      errorClass: "TRANSIENT",
      retryCount: 0,
      stepId: "refresh-intelligence",
    });
    assert.equal(retryPreview.strategy?.kind, "retry");
    assert.equal(retryPreview.strategy?.strategyId, "str-retry-transient");

    const rollbackPreview = previewRecoveryStrategy({
      recoveryRegistryId: "rec-foundation-default",
      errorClass: "BRAIN_DISPATCH_ERROR",
      retryCount: 0,
      stepId: "execute-approved-action",
    });
    assert.equal(rollbackPreview.strategy?.kind, "rollback");
    assert.equal(rollbackPreview.strategy?.strategyId, "str-rollback-mapped");

    const escalatePreview = previewRecoveryStrategy({
      recoveryRegistryId: "rec-foundation-default",
      errorClass: "TRANSIENT",
      retryCount: 3,
      stepId: "refresh-intelligence",
    });
    assert.equal(escalatePreview.strategy?.kind, "escalate");
  });

  it("classifies failure categories from error classes", () => {
    resetG506Harness();
    assert.equal(classifyFailureCategory("VALIDATION_BLOCK"), "plugin_failure");
    assert.equal(classifyFailureCategory("TRANSIENT"), "execution_failure");
    assert.equal(classifyFailureCategory("APPROVAL_REQUIRED"), "approval_failure");
    assert.equal(classifyFailureCategory(undefined), "unexpected_exception");
  });

  it("schedules registry-driven retry on transient failures", async () => {
    resetG506Harness();
    const queueId = seedWaitingQueueEntry("ws_g506_retry", "corr-retry");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g506",
      workspaceId: "ws_g506_retry",
      queueId,
    });

    const outcome = await simulateAutomationFailure({
      executionId: pickup.executionId,
      failedStepId: "refresh-intelligence",
      actorId: "actor_g506",
      workspaceId: "ws_g506_retry",
      errorClass: "TRANSIENT",
      errorMessage: "Transient Brain dispatch failure",
    });

    assert.equal(outcome.handled, true);
    assert.equal(outcome.recoveryState, "retrying");
    assert.equal(getAutomationQueue().getById(queueId)?.executionState, "retrying");

    const recovery = getAutomationRecoveryStatus(pickup.executionId);
    assert.equal(recovery.found, true);
    assert.equal(recovery.recoveryState, "retrying");
    assert.equal(recovery.retryCount, 1);
  });

  it("executes registry rollback and restores safe state via Brain orchestration", async () => {
    resetG506Harness();
    const failedOnce = new Set<string>();
    setAutomationBrainDispatch(async (request) => {
      const stepId = String(request.payload?.stepId ?? "");
      if (stepId === "execute-approved-action" && !failedOnce.has(stepId)) {
        failedOnce.add(stepId);
        throw new Error("Simulated execution failure for rollback");
      }
      return {
        correlationId: request.correlationId ?? "mock",
        status: "completed",
        result: { acknowledged: true },
      };
    });

    const queueId = seedWaitingQueueEntry("ws_g506_rollback", "corr-rollback");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g506",
      workspaceId: "ws_g506_rollback",
      queueId,
    });

    await advanceAutomationRun({
      actorId: "actor_g506",
      workspaceId: "ws_g506_rollback",
      executionId: pickup.executionId,
    });

    const recovery = getAutomationRecoveryStatus(pickup.executionId);
    assert.equal(recovery.found, true);
    assert.equal(recovery.recoveryState, "recovered");
    assert.ok(recovery.rollbackId);

    const rollback = getAutomationRollbackStatus({ executionId: pickup.executionId });
    assert.equal(rollback.found, true);
    assert.equal(rollback.rollback?.rollbackStrategyId, "str-rollback-mapped");
    assert.equal(rollback.rollback?.failureCause, "Simulated execution failure for rollback");
    assert.equal(rollback.rollback?.pillowGovernance, true);
    assert.ok(rollback.rollback?.rollbackStrategyId);
  });

  it("escalates unrecoverable failures per registry policy", async () => {
    resetG506Harness();
    const queueId = seedWaitingQueueEntry("ws_g506_escalate", "corr-escalate");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g506",
      workspaceId: "ws_g506_escalate",
      queueId,
    });

    await simulateAutomationFailure({
      executionId: pickup.executionId,
      failedStepId: "refresh-intelligence",
      actorId: "actor_g506",
      workspaceId: "ws_g506_escalate",
      errorClass: "TRANSIENT",
    });
    await simulateAutomationFailure({
      executionId: pickup.executionId,
      failedStepId: "refresh-intelligence",
      actorId: "actor_g506",
      workspaceId: "ws_g506_escalate",
      errorClass: "TRANSIENT",
    });
    await simulateAutomationFailure({
      executionId: pickup.executionId,
      failedStepId: "refresh-intelligence",
      actorId: "actor_g506",
      workspaceId: "ws_g506_escalate",
      errorClass: "TRANSIENT",
    });
    const outcome = await simulateAutomationFailure({
      executionId: pickup.executionId,
      failedStepId: "refresh-intelligence",
      actorId: "actor_g506",
      workspaceId: "ws_g506_escalate",
      errorClass: "TRANSIENT",
    });

    assert.equal(outcome.recoveryState, "escalated");
    const recovery = getAutomationRecoveryStatus(pickup.executionId);
    assert.equal(recovery.recoveryState, "escalated");
    assert.equal(getAutomationQueue().getById(queueId)?.executionState, "failed");
  });

  it("records recovery history through Pillow EKLS governance", async () => {
    resetG506Harness();
    const queueId = seedWaitingQueueEntry("ws_g506_ekls", "corr-ekls");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g506",
      workspaceId: "ws_g506_ekls",
      queueId,
    });

    await simulateAutomationFailure({
      executionId: pickup.executionId,
      failedStepId: "refresh-intelligence",
      actorId: "actor_g506",
      workspaceId: "ws_g506_ekls",
      errorClass: "TRANSIENT",
    });

    const events = listRecoveryAuditEvents("ws_g506_ekls");
    assert.ok(events.some((event) => event.eventType === "failure_history"));
    assert.ok(events.some((event) => event.eventType === "recovery_history"));
    assert.equal(events.every((event) => event.pillowGovernance === true), true);
    assert.ok(
      events.some(
        (event) =>
          event.eventType === "failure_history" &&
          typeof event.evidence?.recoveryConfidence === "number",
      ),
    );
  });

  it("notifies Guardian on failure, recovery, rollback, and escalation events", async () => {
    resetG506Harness();
    const failedOnce = new Set<string>();
    setAutomationBrainDispatch(async (request) => {
      const stepId = String(request.payload?.stepId ?? "");
      if (stepId === "execute-approved-action" && !failedOnce.has(stepId)) {
        failedOnce.add(stepId);
        throw new Error("Guardian rollback observation test");
      }
      return {
        correlationId: request.correlationId ?? "mock",
        status: "completed",
        result: { ok: true },
      };
    });

    const queueId = seedWaitingQueueEntry("ws_g506_guardian", "corr-guardian");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g506",
      workspaceId: "ws_g506_guardian",
      queueId,
    });

    await advanceAutomationRun({
      actorId: "actor_g506",
      workspaceId: "ws_g506_guardian",
      executionId: pickup.executionId,
    });

    const events = listGuardianRecoveryEvents("ws_g506_guardian");
    assert.ok(events.some((event) => event.eventKind === "failure"));
    assert.ok(events.some((event) => event.eventKind === "rollback"));
  });

  it("exposes Cockpit recovery status without UI redesign", async () => {
    resetG506Harness();
    const queueId = seedWaitingQueueEntry("ws_g506_cockpit", "corr-cockpit");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g506",
      workspaceId: "ws_g506_cockpit",
      queueId,
    });

    await simulateAutomationFailure({
      executionId: pickup.executionId,
      failedStepId: "refresh-intelligence",
      actorId: "actor_g506",
      workspaceId: "ws_g506_cockpit",
      errorClass: "TRANSIENT",
    });

    const cockpit = getCockpitAutomationRecoveryStatus("ws_g506_cockpit");
    assert.equal(cockpit.workspaceId, "ws_g506_cockpit");
    assert.ok(cockpit.records.length >= 1);
    assert.ok(cockpit.failureSummaries.length >= 1);
    assert.ok(cockpit.generatedAt);
  });

  it("supports plugin failure analysers without modifying recovery core", async () => {
    resetG506Harness();
    recoveryPluginRegistry.registerFailureAnalyser({
      pluginId: "custom-analyser",
      analyse: () => ({
        category: "business_engine_failure",
        rootCause: "Plugin-identified business engine fault",
        confidence: 0.95,
      }),
    });

    const queueId = seedWaitingQueueEntry("ws_g506_plugin", "corr-plugin");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g506",
      workspaceId: "ws_g506_plugin",
      queueId,
    });

    await simulateAutomationFailure({
      executionId: pickup.executionId,
      failedStepId: "refresh-intelligence",
      actorId: "actor_g506",
      workspaceId: "ws_g506_plugin",
      errorClass: "ENGINE_FAULT",
    });

    const recovery = getAutomationRecoveryStatus(pickup.executionId);
    assert.equal(recovery.failureCategory, "business_engine_failure");
    const events = listRecoveryAuditEvents("ws_g506_plugin");
    assert.ok(
      events.some(
        (event) => event.evidence?.rootCause === "Plugin-identified business engine fault",
      ),
    );
  });

  it("pauses Brain execution on failure and resumes only after successful recovery", async () => {
    resetG506Harness();
    const failedOnce = new Set<string>();
    setAutomationBrainDispatch(async (request) => {
      const stepId = String(request.payload?.stepId ?? "");
      if (stepId === "execute-approved-action" && !failedOnce.has(stepId)) {
        failedOnce.add(stepId);
        throw new Error("Brain pause/resume rollback test");
      }
      return {
        correlationId: request.correlationId ?? "mock",
        status: "completed",
        result: { ok: true },
      };
    });

    const queueId = seedWaitingQueueEntry("ws_g506_brain", "corr-brain");
    await promoteToWaiting(queueId);
    const pickup = await pickupWaitingAutomation({
      actorId: "actor_g506",
      workspaceId: "ws_g506_brain",
      queueId,
    });

    await advanceAutomationRun({
      actorId: "actor_g506",
      workspaceId: "ws_g506_brain",
      executionId: pickup.executionId,
    });

    const status = getAutomationRunStatus(pickup.executionId);
    assert.equal(status.found, true);
    assert.notEqual(status.lifecycleState, "workflow_failed");

    const recovery = getAutomationRecoveryStatus(pickup.executionId);
    assert.equal(recovery.recoveryState, "recovered");
  });
});
