import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cancelScheduledAutomation,
  dispatchNextQueuedAutomation,
  dispatchToWorkflowScheduler,
  getAutomationQueue,
  getAutomationQueueSnapshot,
  listSchedulerAuditEvents,
  peekSchedulerQueue,
  processSchedulerDueItems,
  receiveAutomationTrigger,
  resetSchedulerAuditLogForTests,
  resetSchedulerPluginRegistryForTests,
  resetTriggerAuditLogForTests,
  resetTriggerEngineForTests,
  resetTriggerPluginRegistryForTests,
  resetWorkflowSchedulerDispatchForTests,
  resolveSchedulePolicy,
  scheduleAutomationRecovery,
  scheduleAutomationRetry,
  schedulerPluginRegistry,
} from "../../orchestration/business-automation/index.js";
import {
  resetAutomationRegistryBatchForTests,
  resetRegistryLoaderForTests,
} from "../../registry/index.js";
import { computeScheduledTime } from "../../orchestration/business-automation/scheduler/schedule-policy-resolver.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

function resetG503Harness(): void {
  resetRegistryLoaderForTests();
  resetAutomationRegistryBatchForTests();
  resetTriggerEngineForTests();
  resetTriggerAuditLogForTests();
  resetWorkflowSchedulerDispatchForTests();
  resetTriggerPluginRegistryForTests();
  resetSchedulerPluginRegistryForTests();
  resetSchedulerAuditLogForTests();
}

describe("G5-03 — Workflow Scheduler & Automation Queue", () => {
  it("resolves schedule timing from REG-AUTOMATION-SCHEDULE and POLICY without hardcoded retry", () => {
    resetG503Harness();
    const policy = resolveSchedulePolicy({
      scheduleRegistryId: "sch-foundation-hourly-slot",
      policyRegistryId: "pol-foundation-default",
    });
    assert.equal(policy.scheduleMode, "recurring");
    assert.equal(policy.intervalMs, 3_600_000);
    assert.equal(policy.maxAttempts, 3);
    assert.equal(policy.backoffMs, 5000);
    assert.equal(policy.executionDeadlineMs, 300_000);
  });

  it("queues immediate automation with full queue contract fields", () => {
    resetG503Harness();
    const request = dispatchToWorkflowScheduler(
      {
        triggerContext: {
          triggerId: "trg-foundation-manual",
          source: "manual_executive",
          workspaceId: "ws_g503",
          companyId: "co_g503",
          brandId: "br_g503",
          environment: "validation",
          decisionReference: "dec-g503",
          registryReferences: {
            triggerId: "trg-foundation-manual",
            triggerVersion: "1.0.0",
            workflowId: "wf-foundation-decision-orchestration",
            workflowVersion: "1.0.0",
            policyId: "pol-foundation-default",
          },
          timestamp: new Date().toISOString(),
          priority: "high",
          correlationId: "corr-g503-immediate",
          approvalState: "not_required",
        },
        workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
        registryRefs: {
          triggerId: "trg-foundation-manual",
          triggerVersion: "1.0.0",
          workflowId: "wf-foundation-decision-orchestration",
          workflowVersion: "1.0.0",
          policyId: "pol-foundation-default",
        },
        approvalRouting: {
          required: false,
          approvalState: "not_required",
          reason: "A0 auto-approved",
        },
        correlationId: "corr-g503-immediate",
      },
      { actorId: "actor_g503" },
    );

    assert.ok(request.queueId);
    const snapshot = getAutomationQueueSnapshot("ws_g503");
    assert.equal(snapshot.totalCount, 1);
    const entry = snapshot.entries[0];
    assert.ok(entry);
    assert.equal(entry.queueId, request.queueId);
    assert.equal(entry.workflowId, "wf-foundation-decision-orchestration");
    assert.equal(entry.triggerId, "trg-foundation-manual");
    assert.equal(entry.workspaceId, "ws_g503");
    assert.equal(entry.companyId, "co_g503");
    assert.equal(entry.brandId, "br_g503");
    assert.equal(entry.priority, "high");
    assert.equal(entry.executionState, "queued");
    assert.equal(entry.correlationId, "corr-g503-immediate");
    assert.equal(entry.decisionReference, "dec-g503");
    assert.equal(entry.retryCount, 0);
    assert.ok(entry.scheduledTime);
    assert.ok(entry.executionDeadline);
    assert.equal(entry.pillowGovernance, true);
  });

  it("maintains priority ordering in the automation queue", () => {
    resetG503Harness();
    const baseContext = {
      source: "manual_executive" as const,
      workspaceId: "ws_g503_prio",
      environment: "validation",
      registryReferences: {
        triggerId: "trg-foundation-manual",
        triggerVersion: "1.0.0",
        workflowId: "wf-foundation-decision-orchestration",
        workflowVersion: "1.0.0",
      },
      timestamp: new Date().toISOString(),
      approvalState: "not_required" as const,
    };

    dispatchToWorkflowScheduler(
      {
        triggerContext: { ...baseContext, triggerId: "t-low", priority: "low", correlationId: "c-low" },
        workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
        registryRefs: baseContext.registryReferences,
        approvalRouting: { required: false, approvalState: "not_required", reason: "ok" },
        correlationId: "c-low",
      },
      { actorId: "actor" },
    );
    dispatchToWorkflowScheduler(
      {
        triggerContext: { ...baseContext, triggerId: "t-critical", priority: "critical", correlationId: "c-critical" },
        workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
        registryRefs: baseContext.registryReferences,
        approvalRouting: { required: false, approvalState: "not_required", reason: "ok" },
        correlationId: "c-critical",
      },
      { actorId: "actor" },
    );

    const ordered = getAutomationQueue().list({ workspaceId: "ws_g503_prio" });
    assert.equal(ordered[0]?.priority, "critical");
    assert.equal(ordered[1]?.priority, "low");
  });

  it("transitions scheduled entries to queued when due", async () => {
    resetG503Harness();
    const future = new Date(Date.now() + 60_000).toISOString();
    dispatchToWorkflowScheduler(
      {
        triggerContext: {
          triggerId: "trg-foundation-manual",
          source: "manual_executive",
          workspaceId: "ws_g503_due",
          environment: "validation",
          registryReferences: {
            triggerId: "trg-foundation-manual",
            triggerVersion: "1.0.0",
            workflowId: "wf-foundation-decision-orchestration",
            workflowVersion: "1.0.0",
          },
          timestamp: new Date().toISOString(),
          priority: "normal",
          correlationId: "corr-deferred",
          approvalState: "not_required",
        },
        workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
        registryRefs: {
          triggerId: "trg-foundation-manual",
          triggerVersion: "1.0.0",
          workflowId: "wf-foundation-decision-orchestration",
          workflowVersion: "1.0.0",
        },
        approvalRouting: { required: false, approvalState: "not_required", reason: "ok" },
        correlationId: "corr-deferred",
      },
      { actorId: "actor", deferUntil: future, scheduleMode: "deferred" },
    );

    const before = getAutomationQueueSnapshot("ws_g503_due");
    assert.equal(before.entries[0]?.executionState, "scheduled");

    const later = new Date(Date.now() + 120_000).toISOString();
    const result = await processSchedulerDueItems({ nowIso: later });
    assert.equal(result.promotedCount, 1);
    assert.equal(getAutomationQueueSnapshot("ws_g503_due").entries[0]?.executionState, "queued");
  });

  it("schedules retries using registry backoff policy", async () => {
    resetG503Harness();
    const request = dispatchToWorkflowScheduler(
      {
        triggerContext: {
          triggerId: "trg-foundation-manual",
          source: "manual_executive",
          workspaceId: "ws_g503_retry",
          environment: "validation",
          registryReferences: {
            triggerId: "trg-foundation-manual",
            triggerVersion: "1.0.0",
            workflowId: "wf-foundation-decision-orchestration",
            workflowVersion: "1.0.0",
            policyId: "pol-foundation-default",
          },
          timestamp: new Date().toISOString(),
          priority: "normal",
          correlationId: "corr-retry",
          approvalState: "not_required",
        },
        workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
        registryRefs: {
          triggerId: "trg-foundation-manual",
          triggerVersion: "1.0.0",
          workflowId: "wf-foundation-decision-orchestration",
          workflowVersion: "1.0.0",
          policyId: "pol-foundation-default",
        },
        approvalRouting: { required: false, approvalState: "not_required", reason: "ok" },
        correlationId: "corr-retry",
      },
      { actorId: "actor" },
    );

    const retry = await scheduleAutomationRetry({
      queueId: request.queueId!,
      actorId: "actor",
      workspaceId: "ws_g503_retry",
      errorClass: "TRANSIENT_BRAIN_ERROR",
    });

    assert.equal(retry.retryCount, 1);
    assert.equal(retry.executionState, "scheduled");
    const policy = resolveSchedulePolicy({ policyRegistryId: "pol-foundation-default", scheduleMode: "retry" });
    const expected = computeScheduledTime({
      policy,
      nowMs: Date.now(),
      retryCount: 1,
    });
    const entry = getAutomationQueue().getById(request.queueId!)!;
    assert.ok(Math.abs(Date.parse(entry.scheduledTime) - Date.parse(expected)) < 2000);
  });

  it("records scheduler audit events through Pillow EKLS governance", () => {
    resetG503Harness();
    dispatchToWorkflowScheduler(
      {
        triggerContext: {
          triggerId: "trg-foundation-manual",
          source: "manual_executive",
          workspaceId: "ws_g503_audit",
          environment: "validation",
          registryReferences: {
            triggerId: "trg-foundation-manual",
            triggerVersion: "1.0.0",
            workflowId: "wf-foundation-decision-orchestration",
            workflowVersion: "1.0.0",
          },
          timestamp: new Date().toISOString(),
          priority: "normal",
          correlationId: "corr-audit",
          approvalState: "not_required",
        },
        workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
        registryRefs: {
          triggerId: "trg-foundation-manual",
          triggerVersion: "1.0.0",
          workflowId: "wf-foundation-decision-orchestration",
          workflowVersion: "1.0.0",
        },
        approvalRouting: { required: false, approvalState: "not_required", reason: "ok" },
        correlationId: "corr-audit",
      },
      { actorId: "actor_audit" },
    );

    const events = listSchedulerAuditEvents("ws_g503_audit");
    assert.ok(events.some((event) => event.eventType === "workflow_scheduled"));
    assert.ok(events.some((event) => event.eventType === "workflow_queued"));
    assert.equal(events.every((event) => event.pillowGovernance === true), true);
  });

  it("dispatches queued automation to waiting state without executing workflows", async () => {
    resetG503Harness();
    dispatchToWorkflowScheduler(
      {
        triggerContext: {
          triggerId: "trg-foundation-manual",
          source: "manual_executive",
          workspaceId: "ws_g503_dispatch",
          environment: "validation",
          registryReferences: {
            triggerId: "trg-foundation-manual",
            triggerVersion: "1.0.0",
            workflowId: "wf-foundation-decision-orchestration",
            workflowVersion: "1.0.0",
          },
          timestamp: new Date().toISOString(),
          priority: "normal",
          correlationId: "corr-dispatch",
          approvalState: "not_required",
        },
        workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
        registryRefs: {
          triggerId: "trg-foundation-manual",
          triggerVersion: "1.0.0",
          workflowId: "wf-foundation-decision-orchestration",
          workflowVersion: "1.0.0",
        },
        approvalRouting: { required: false, approvalState: "not_required", reason: "ok" },
        correlationId: "corr-dispatch",
      },
      { actorId: "actor" },
    );

    const dispatch = await dispatchNextQueuedAutomation({});
    assert.equal(dispatch.dispatched, true);
    assert.equal(dispatch.executionState, "waiting");
  });

  it("integrates Brain trigger intake through scheduler and queue when accepted", async () => {
    resetG503Harness();
    const result = await receiveAutomationTrigger({
      category: "manual_executive",
      workspaceId: "ws_g503_brain",
      actorId: "actor_brain",
      correlationId: "corr-brain-intake",
      pillowGovernance: true,
      registryTriggerId: "trg-foundation-decision-gate",
      payload: {},
    });

    if (result.outcome === "approval_required") {
      assert.equal(result.automationRequest, undefined);
      assert.equal(getAutomationQueueSnapshot("ws_g503_brain").totalCount, 0);
      return;
    }

    if (result.outcome === "accepted") {
      assert.ok(result.automationRequest?.queueId);
      assert.ok(peekSchedulerQueue("ws_g503_brain").length >= 1);
      assert.ok(getAutomationQueueSnapshot("ws_g503_brain").totalCount >= 1);
      return;
    }

    assert.ok(result.reason);
    assert.equal(getAutomationQueueSnapshot("ws_g503_brain").totalCount, 0);
  });

  it("supports plugin scheduler registration without modifying scheduler core", () => {
    resetG503Harness();
    schedulerPluginRegistry.registerScheduler({
      pluginId: "plugin-manual-slot",
      scheduleMode: "manual",
      computeScheduledTime: ({ nowMs }) => new Date(nowMs + 15_000).toISOString(),
    });

    dispatchToWorkflowScheduler(
      {
        triggerContext: {
          triggerId: "trg-foundation-manual",
          source: "manual_executive",
          workspaceId: "ws_g503_plugin",
          environment: "validation",
          registryReferences: {
            triggerId: "trg-foundation-manual",
            triggerVersion: "1.0.0",
            workflowId: "wf-foundation-decision-orchestration",
            workflowVersion: "1.0.0",
          },
          timestamp: new Date().toISOString(),
          priority: "normal",
          correlationId: "corr-plugin",
          approvalState: "not_required",
        },
        workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
        registryRefs: {
          triggerId: "trg-foundation-manual",
          triggerVersion: "1.0.0",
          workflowId: "wf-foundation-decision-orchestration",
          workflowVersion: "1.0.0",
        },
        approvalRouting: { required: false, approvalState: "not_required", reason: "ok" },
        correlationId: "corr-plugin",
      },
      { actorId: "actor", scheduleMode: "manual" },
    );

    const entry = getAutomationQueueSnapshot("ws_g503_plugin").entries[0];
    assert.equal(entry?.scheduleMode, "manual");
    assert.equal(entry?.executionState, "scheduled");
  });

  it("cancels scheduled automation with audit trail", async () => {
    resetG503Harness();
    const request = dispatchToWorkflowScheduler(
      {
        triggerContext: {
          triggerId: "trg-foundation-manual",
          source: "manual_executive",
          workspaceId: "ws_g503_cancel",
          environment: "validation",
          registryReferences: {
            triggerId: "trg-foundation-manual",
            triggerVersion: "1.0.0",
            workflowId: "wf-foundation-decision-orchestration",
            workflowVersion: "1.0.0",
          },
          timestamp: new Date().toISOString(),
          priority: "normal",
          correlationId: "corr-cancel",
          approvalState: "not_required",
        },
        workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
        registryRefs: {
          triggerId: "trg-foundation-manual",
          triggerVersion: "1.0.0",
          workflowId: "wf-foundation-decision-orchestration",
          workflowVersion: "1.0.0",
        },
        approvalRouting: { required: false, approvalState: "not_required", reason: "ok" },
        correlationId: "corr-cancel",
      },
      { actorId: "actor" },
    );

    const cancelled = await cancelScheduledAutomation({
      queueId: request.queueId!,
      actorId: "actor",
      workspaceId: "ws_g503_cancel",
    });
    assert.equal(cancelled.executionState, "cancelled");
    assert.ok(listSchedulerAuditEvents("ws_g503_cancel").some((e) => e.eventType === "workflow_cancelled"));
  });

  it("schedules recovery using REG-AUTOMATION-RECOVERY", async () => {
    resetG503Harness();
    const request = dispatchToWorkflowScheduler(
      {
        triggerContext: {
          triggerId: "trg-foundation-manual",
          source: "manual_executive",
          workspaceId: "ws_g503_recovery",
          environment: "validation",
          registryReferences: {
            triggerId: "trg-foundation-manual",
            triggerVersion: "1.0.0",
            workflowId: "wf-foundation-decision-orchestration",
            workflowVersion: "1.0.0",
            policyId: "pol-foundation-default",
          },
          timestamp: new Date().toISOString(),
          priority: "normal",
          correlationId: "corr-recovery",
          approvalState: "not_required",
        },
        workflowRef: { id: "wf-foundation-decision-orchestration", version: "1.0.0" },
        registryRefs: {
          triggerId: "trg-foundation-manual",
          triggerVersion: "1.0.0",
          workflowId: "wf-foundation-decision-orchestration",
          workflowVersion: "1.0.0",
          policyId: "pol-foundation-default",
        },
        approvalRouting: { required: false, approvalState: "not_required", reason: "ok" },
        correlationId: "corr-recovery",
      },
      { actorId: "actor" },
    );

    const recovered = await scheduleAutomationRecovery({
      queueId: request.queueId!,
      recoveryRegistryId: "rec-foundation-default",
      actorId: "actor",
      workspaceId: "ws_g503_recovery",
    });
    assert.equal(recovered.executionState, "scheduled");
    const entry = getAutomationQueue().getById(request.queueId!)!;
    assert.equal(entry.recoveryRegistryId, "rec-foundation-default");
    assert.equal(entry.scheduleMode, "recovery");
  });
});
