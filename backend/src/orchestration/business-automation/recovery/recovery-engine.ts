/**
 * G5-06 — Recovery Engine (failure detection & coordination — no business logic).
 */

import { randomUUID } from "node:crypto";
import type { AutomationRun } from "../contracts/orchestrator-types.js";
import type {
  RecoveryHistoryEntry,
  RecoveryOutcome,
  RecoveryRecord,
  RecoveryState,
  ExecutionSnapshot,
} from "../contracts/recovery-types.js";
import { recordRecoveryAuditEvent } from "../audit/recovery-audit-recorder.js";
import { validateRecoveryMutation } from "../governance/recovery-pillow-governance.js";
import { notifyGuardianRecoveryEvent } from "../guardian/guardian-recovery-bridge.js";
import { getAutomationQueue } from "../queue/automation-queue.js";
import { getWorkflowOrchestrator } from "../orchestrator/workflow-orchestrator.js";
import { getWorkflowScheduler } from "../scheduler/workflow-scheduler.js";
import {
  resolveRecoveryPolicy,
  selectRecoveryStrategy,
} from "./recovery-policy-resolver.js";
import { recoveryPluginRegistry } from "./recovery-plugin-registry.js";
import { getRecoveryRecordStore } from "./recovery-record-store.js";
import { captureExecutionSnapshot, getRollbackEngine } from "./rollback-engine.js";

function nowIso(): string {
  return new Date().toISOString();
}

function appendHistory(
  record: RecoveryRecord,
  state: RecoveryState,
  actorId: string,
  reason: string,
): RecoveryHistoryEntry {
  const entry: RecoveryHistoryEntry = {
    entryId: randomUUID(),
    state,
    actorId,
    reason,
    recordedAt: nowIso(),
  };
  record.history.push(entry);
  record.recoveryState = state;
  record.updatedAt = nowIso();
  return entry;
}

export class RecoveryEngine {
  private readonly store = getRecoveryRecordStore();
  private readonly rollbackEngine = getRollbackEngine();

  capturePreStepSnapshot(run: AutomationRun): ExecutionSnapshot {
    const snapshot = captureExecutionSnapshot(run);
    const existing = this.store.getRecoveryByExecution(run.executionId);
    if (existing) {
      existing.lastSnapshot = snapshot;
      this.store.saveRecovery(existing);
    }
    return snapshot;
  }

  async handleExecutionFailure(input: {
    run: AutomationRun;
    failedStepId: string;
    errorClass?: string;
    errorMessage?: string;
    actorId: string;
  }): Promise<RecoveryOutcome> {
    const governance = validateRecoveryMutation({
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.run.executionContext.workspaceId,
      companyId: input.run.executionContext.companyId,
      executionId: input.run.executionId,
    });
    if (!governance.eligible) {
      return {
        recoveryId: "rejected",
        recoveryState: "failed",
        resumed: false,
        reason: governance.reason,
      };
    }

    getWorkflowOrchestrator().pauseRun(input.run.executionId, input.actorId);

    const analysis = recoveryPluginRegistry.analyseFailure({
      errorClass: input.errorClass,
      errorMessage: input.errorMessage,
    });
    const failureCategory = analysis.category;

    const policy = resolveRecoveryPolicy({
      recoveryRegistryId: input.run.executionContext.recoveryRegistryId,
      policyRegistryId: input.run.executionContext.policyRegistryId,
    });

    let record = this.store.getRecoveryByExecution(input.run.executionId);
    if (!record) {
      record = {
        recoveryId: randomUUID(),
        executionId: input.run.executionId,
        queueId: input.run.queueId,
        workflowId: input.run.executionContext.workflowId,
        triggerId: input.run.executionContext.triggerId,
        correlationId: input.run.executionContext.correlationId,
        workspaceId: input.run.executionContext.workspaceId,
        companyId: input.run.executionContext.companyId,
        brandId: input.run.executionContext.brandId,
        recoveryState: "monitoring",
        failureCategory,
        failureCause: input.errorMessage ?? analysis.rootCause,
        failedStepId: input.failedStepId,
        errorClass: input.errorClass,
        recoveryRegistryId: policy.recoveryRegistryId,
        policyRegistryId: policy.policyRegistryId,
        retryCount: 0,
        maxAttempts: policy.maxAttempts,
        history: [],
        lastSnapshot: captureExecutionSnapshot(input.run),
        pillowGovernance: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      appendHistory(record, "monitoring", input.actorId, "Failure detected — monitoring");
      this.store.saveRecovery(record);
    }

    recordRecoveryAuditEvent({
      eventType: "failure_history",
      workspaceId: record.workspaceId,
      actorId: input.actorId,
      recoveryId: record.recoveryId,
      executionId: record.executionId,
      workflowId: record.workflowId,
      correlationId: record.correlationId,
      recoveryState: record.recoveryState,
      failureCategory,
      reason: record.failureCause,
      evidence: {
        failedStepId: input.failedStepId,
        errorClass: input.errorClass,
        rootCause: analysis.rootCause,
        recoveryConfidence: analysis.confidence,
      },
    });

    notifyGuardianRecoveryEvent({
      eventKind: "failure",
      workspaceId: record.workspaceId,
      executionId: record.executionId,
      recoveryId: record.recoveryId,
      correlationId: record.correlationId,
      message: record.failureCause,
      metadata: { failureCategory, failedStepId: input.failedStepId },
    });

    appendHistory(record, "recovering", input.actorId, "Evaluating registry recovery strategy");
    this.store.saveRecovery(record);

    const strategy = selectRecoveryStrategy(policy, {
      errorClass: input.errorClass ?? "",
      retryCount: record.retryCount,
      maxAttempts: record.maxAttempts,
      rollbackMapHasStep: Boolean(policy.rollbackMap[input.failedStepId]),
      stepId: input.failedStepId,
    });

    if (!strategy) {
      appendHistory(record, "failed", input.actorId, "No recovery strategy resolved");
      this.store.saveRecovery(record);
      return this.finalizeFailed(record, input.actorId, "No recovery strategy resolved");
    }

    record.recoveryStrategyId = strategy.strategyId;

    switch (strategy.kind) {
      case "retry":
        return this.handleRetryStrategy(record, input, policy.backoffMs);
      case "rollback":
        return this.handleRollbackStrategy(record, input, policy, strategy.strategyId);
      case "escalate":
        return this.handleEscalateStrategy(record, input.actorId, strategy.strategyId);
      case "halt":
      default:
        return this.finalizeFailed(record, input.actorId, `Recovery halted (${strategy.strategyId})`);
    }
  }

  private async handleRetryStrategy(
    record: RecoveryRecord,
    input: { run: AutomationRun; actorId: string; errorClass?: string },
    _backoffMs: number,
  ): Promise<RecoveryOutcome> {
    if (record.retryCount >= record.maxAttempts) {
      return this.handleEscalateStrategy(record, input.actorId, "str-escalate-unrecoverable");
    }

    appendHistory(record, "retrying", input.actorId, "Scheduling registry-driven retry");
    record.retryCount += 1;
    this.store.saveRecovery(record);

    try {
      getWorkflowScheduler().scheduleRetry(input.run.queueId, input.actorId, {
        errorClass: input.errorClass,
      });
      getAutomationQueue().updateState(input.run.queueId, "retrying");

      recordRecoveryAuditEvent({
        eventType: "recovery_history",
        workspaceId: record.workspaceId,
        actorId: input.actorId,
        recoveryId: record.recoveryId,
        executionId: record.executionId,
        workflowId: record.workflowId,
        correlationId: record.correlationId,
        recoveryState: "retrying",
        failureCategory: record.failureCategory,
        reason: `Retry ${record.retryCount} scheduled via registry policy`,
      });

      notifyGuardianRecoveryEvent({
        eventKind: "recovery",
        workspaceId: record.workspaceId,
        executionId: record.executionId,
        recoveryId: record.recoveryId,
        correlationId: record.correlationId,
        message: `Retry scheduled (${record.retryCount}/${record.maxAttempts})`,
      });

      appendHistory(record, "retrying", input.actorId, "Retry scheduled — Brain paused until retry");
      record.recoveryResult = "retry_scheduled";
      this.store.saveRecovery(record);

      return {
        recoveryId: record.recoveryId,
        recoveryState: "retrying",
        resumed: false,
        reason: "Retry scheduled via registry policy",
      };
    } catch {
      return this.handleRollbackStrategy(
        record,
        { run: input.run, failedStepId: record.failedStepId ?? "", actorId: input.actorId },
        resolveRecoveryPolicy({
          recoveryRegistryId: record.recoveryRegistryId,
          policyRegistryId: record.policyRegistryId,
        }),
        "str-rollback-mapped",
      );
    }
  }

  private handleRollbackStrategy(
    record: RecoveryRecord,
    input: { run: AutomationRun; failedStepId: string; actorId: string },
    policy: ReturnType<typeof resolveRecoveryPolicy>,
    strategyId: string,
  ): RecoveryOutcome {
    const rollbackStepId = policy.rollbackMap[input.failedStepId];
    if (!rollbackStepId) {
      return this.finalizeFailed(record, input.actorId, "No rollback mapping in registry");
    }

    appendHistory(record, "rolling_back", input.actorId, `Rollback to ${rollbackStepId}`);
    record.rollbackStrategyId = strategyId;
    this.store.saveRecovery(record);

    const { run, rollback } = this.rollbackEngine.executeRollback({
      run: input.run,
      failedStepId: input.failedStepId,
      rollbackStepId,
      recoveryStrategyId: strategyId,
      rollbackStrategyId: strategyId,
      failureCause: record.failureCause,
      actorId: input.actorId,
    });

    record.rollbackId = rollback.rollbackId;
    appendHistory(record, "recovered", input.actorId, "Rollback completed — safe state restored");
    record.recoveryResult = "rollback_completed";
    this.store.saveRecovery(record);

    getAutomationQueue().updateState(run.queueId, "recovered");

    recordRecoveryAuditEvent({
      eventType: "rollback_history",
      workspaceId: record.workspaceId,
      actorId: input.actorId,
      recoveryId: record.recoveryId,
      executionId: record.executionId,
      workflowId: record.workflowId,
      correlationId: record.correlationId,
      recoveryState: "recovered",
      failureCategory: record.failureCategory,
      reason: `Rollback to ${rollbackStepId} via ${strategyId}`,
      evidence: { rollbackId: rollback.rollbackId, lessonsLearned: "Registry rollback restored safe state" },
    });

    notifyGuardianRecoveryEvent({
      eventKind: "rollback",
      workspaceId: record.workspaceId,
      executionId: record.executionId,
      recoveryId: record.recoveryId,
      correlationId: record.correlationId,
      message: `Rollback applied to ${rollbackStepId}`,
      metadata: { rollbackId: rollback.rollbackId },
    });

    return {
      recoveryId: record.recoveryId,
      recoveryState: "recovered",
      resumed: true,
      rollbackId: rollback.rollbackId,
      reason: "Rollback completed — workflow may resume",
    };
  }

  private handleEscalateStrategy(
    record: RecoveryRecord,
    actorId: string,
    strategyId: string,
  ): RecoveryOutcome {
    appendHistory(record, "escalated", actorId, `Escalated via ${strategyId}`);
    record.recoveryStrategyId = strategyId;
    record.recoveryResult = "escalated";
    this.store.saveRecovery(record);

    recordRecoveryAuditEvent({
      eventType: "recovery_history",
      workspaceId: record.workspaceId,
      actorId,
      recoveryId: record.recoveryId,
      executionId: record.executionId,
      workflowId: record.workflowId,
      correlationId: record.correlationId,
      recoveryState: "escalated",
      failureCategory: record.failureCategory,
      reason: "Unrecoverable failure escalated per registry policy",
    });

    notifyGuardianRecoveryEvent({
      eventKind: "escalation",
      workspaceId: record.workspaceId,
      executionId: record.executionId,
      recoveryId: record.recoveryId,
      correlationId: record.correlationId,
      message: "Recovery escalated — operational observer notified",
    });

    getAutomationQueue().updateState(record.queueId, "failed");

    return {
      recoveryId: record.recoveryId,
      recoveryState: "escalated",
      resumed: false,
      reason: "Failure escalated per registry policy",
    };
  }

  private finalizeFailed(
    record: RecoveryRecord,
    actorId: string,
    reason: string,
  ): RecoveryOutcome {
    appendHistory(record, "failed", actorId, reason);
    record.recoveryResult = "failed";
    this.store.saveRecovery(record);
    getAutomationQueue().updateState(record.queueId, "failed");

    recordRecoveryAuditEvent({
      eventType: "failure_history",
      workspaceId: record.workspaceId,
      actorId,
      recoveryId: record.recoveryId,
      executionId: record.executionId,
      workflowId: record.workflowId,
      correlationId: record.correlationId,
      recoveryState: "failed",
      failureCategory: record.failureCategory,
      reason,
    });

    return {
      recoveryId: record.recoveryId,
      recoveryState: "failed",
      resumed: false,
      reason,
    };
  }

  getCockpitRecoveryStatus(workspaceId: string) {
    const records = this.store.listRecoveries(workspaceId);
    const rollbacks = this.store.listRollbacks(workspaceId);
    return {
      workspaceId,
      activeRecoveries: records.filter((record) =>
        ["monitoring", "recovering", "retrying", "rolling_back"].includes(record.recoveryState),
      ).length,
      escalatedCount: records.filter((record) => record.recoveryState === "escalated").length,
      failedCount: records.filter((record) => record.recoveryState === "failed").length,
      records,
      rollbacks,
      failureSummaries: records.map((record) => ({
        recoveryId: record.recoveryId,
        failureCategory: record.failureCategory,
        failureCause: record.failureCause,
        recoveryState: record.recoveryState,
      })),
      generatedAt: nowIso(),
    };
  }

  resetForTests(): void {
    this.store.resetForTests();
  }
}

let sharedEngine: RecoveryEngine | undefined;

export function getRecoveryEngine(): RecoveryEngine {
  if (!sharedEngine) {
    sharedEngine = new RecoveryEngine();
  }
  return sharedEngine;
}

export function resetRecoveryEngineForTests(): void {
  sharedEngine = undefined;
}
