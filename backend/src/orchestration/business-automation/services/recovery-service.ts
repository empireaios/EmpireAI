/**
 * G5-06 — Recovery & Rollback service (Brain tool handlers).
 */

import type { CockpitRecoveryStatusSnapshot } from "../contracts/recovery-types.js";
import { getRecoveryEngine } from "../recovery/recovery-engine.js";
import { getRecoveryRecordStore } from "../recovery/recovery-record-store.js";
import {
  classifyFailureCategory,
  resolveRecoveryPolicy,
  selectRecoveryStrategy,
} from "../recovery/recovery-policy-resolver.js";
import { getAutomationRunStore } from "../state/automation-run-store.js";

export function resolveRecoveryPolicyPreview(input: {
  recoveryRegistryId?: string;
  policyRegistryId?: string;
}) {
  const policy = resolveRecoveryPolicy(input);
  return {
    recoveryRegistryId: policy.recoveryRegistryId,
    policyRegistryId: policy.policyRegistryId,
    maxAttempts: policy.maxAttempts,
    backoffMs: policy.backoffMs,
    strategies: policy.strategies,
    rollbackMap: policy.rollbackMap,
    notificationRegistryIds: policy.notificationRegistryIds,
  };
}

export function previewRecoveryStrategy(input: {
  recoveryRegistryId?: string;
  policyRegistryId?: string;
  errorClass?: string;
  retryCount?: number;
  stepId?: string;
}) {
  const policy = resolveRecoveryPolicy({
    recoveryRegistryId: input.recoveryRegistryId,
    policyRegistryId: input.policyRegistryId,
  });
  const strategy = selectRecoveryStrategy(policy, {
    errorClass: input.errorClass ?? "",
    retryCount: input.retryCount ?? 0,
    maxAttempts: policy.maxAttempts,
    rollbackMapHasStep: Boolean(input.stepId && policy.rollbackMap[input.stepId]),
    stepId: input.stepId,
  });
  return {
    failureCategory: classifyFailureCategory(input.errorClass),
    strategy: strategy ?? null,
    policy,
  };
}

export function getAutomationRecoveryStatus(executionId: string) {
  const record = getRecoveryRecordStore().getRecoveryByExecution(executionId);
  if (!record) return { found: false as const };
  return {
    found: true as const,
    recoveryId: record.recoveryId,
    recoveryState: record.recoveryState,
    failureCategory: record.failureCategory,
    failureCause: record.failureCause,
    retryCount: record.retryCount,
    maxAttempts: record.maxAttempts,
    recoveryStrategyId: record.recoveryStrategyId,
    rollbackId: record.rollbackId,
    history: record.history,
  };
}

export function getAutomationRollbackStatus(input: { rollbackId?: string; executionId?: string }) {
  const store = getRecoveryRecordStore();
  if (input.rollbackId) {
    const rollback = store.listRollbacks().find((item) => item.rollbackId === input.rollbackId);
    if (!rollback) return { found: false as const };
    return { found: true as const, rollback };
  }
  if (input.executionId) {
    const record = store.getRecoveryByExecution(input.executionId);
    if (!record?.rollbackId) return { found: false as const };
    const rollback = store.listRollbacks().find((item) => item.rollbackId === record.rollbackId);
    if (!rollback) return { found: false as const };
    return { found: true as const, rollback };
  }
  return { found: false as const };
}

export function getCockpitAutomationRecoveryStatus(
  workspaceId: string,
): CockpitRecoveryStatusSnapshot {
  return getRecoveryEngine().getCockpitRecoveryStatus(workspaceId);
}

export async function handleAutomationRecovery(input: {
  executionId: string;
  failedStepId: string;
  actorId: string;
  errorClass?: string;
  errorMessage?: string;
}) {
  const run = getAutomationRunStore().getById(input.executionId);
  if (!run) {
    return { handled: false as const, reason: `Automation run not found: ${input.executionId}` };
  }

  const outcome = await getRecoveryEngine().handleExecutionFailure({
    run,
    failedStepId: input.failedStepId,
    errorClass: input.errorClass,
    errorMessage: input.errorMessage,
    actorId: input.actorId,
  });

  return {
    handled: true as const,
    recoveryId: outcome.recoveryId,
    recoveryState: outcome.recoveryState,
    resumed: outcome.resumed,
    rollbackId: outcome.rollbackId,
    reason: outcome.reason,
  };
}

export async function simulateAutomationFailure(input: {
  executionId: string;
  failedStepId: string;
  actorId: string;
  workspaceId: string;
  errorClass?: string;
  errorMessage?: string;
}) {
  return handleAutomationRecovery({
    executionId: input.executionId,
    failedStepId: input.failedStepId,
    actorId: input.actorId,
    errorClass: input.errorClass ?? "TRANSIENT",
    errorMessage: input.errorMessage ?? "Simulated failure for recovery validation",
  });
}
