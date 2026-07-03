/**
 * G5-06 — Rollback Engine (restore safe state — no business logic).
 */

import { randomUUID } from "node:crypto";
import type { AutomationRun } from "../contracts/orchestrator-types.js";
import type { ExecutionSnapshot, RollbackContext } from "../contracts/recovery-types.js";
import { getRecoveryRecordStore } from "./recovery-record-store.js";
import { recoveryPluginRegistry } from "./recovery-plugin-registry.js";
import { getAutomationRunStore } from "../state/automation-run-store.js";

export function captureExecutionSnapshot(run: AutomationRun): ExecutionSnapshot {
  const stepStates: Record<string, string> = {};
  for (const step of run.steps) {
    stepStates[step.stepId] = step.state;
  }

  return {
    executionId: run.executionId,
    workflowId: run.executionContext.workflowId,
    workflowVersion: run.executionContext.workflowVersion,
    completedStepIds: [...run.completedStepIds],
    stepStates,
    registryReferences: { ...run.executionContext.registryReferences },
    executionContext: {
      workflowId: run.executionContext.workflowId,
      triggerId: run.executionContext.triggerId,
      queueId: run.executionContext.queueId,
      correlationId: run.executionContext.correlationId,
      policyRegistryId: run.executionContext.policyRegistryId,
      recoveryRegistryId: run.executionContext.recoveryRegistryId,
    },
    capturedAt: new Date().toISOString(),
  };
}

export class RollbackEngine {
  private readonly store = getRecoveryRecordStore();
  private readonly runStore = getAutomationRunStore();

  executeRollback(input: {
    run: AutomationRun;
    failedStepId: string;
    rollbackStepId: string;
    recoveryStrategyId: string;
    rollbackStrategyId: string;
    failureCause: string;
    actorId: string;
  }): { run: AutomationRun; rollback: RollbackContext } {
    const rollbackId = randomUUID();
    let run = input.run;

    run.lifecycleState = "workflow_recovered";
    run.executionContext.executionState = "workflow_recovered";
    run.failedStepId = undefined;

    const failedStepRecord = run.steps.find((step) => step.stepId === input.failedStepId);
    if (failedStepRecord) {
      failedStepRecord.state = "pending";
      failedStepRecord.errorClass = undefined;
      failedStepRecord.errorMessage = undefined;
      failedStepRecord.completedAt = undefined;
      failedStepRecord.brainDispatchId = undefined;
    }

    const rollbackRecord = run.steps.find((step) => step.stepId === input.rollbackStepId);
    if (rollbackRecord) {
      rollbackRecord.state = "pending";
      rollbackRecord.errorClass = undefined;
      rollbackRecord.errorMessage = undefined;
      rollbackRecord.completedAt = undefined;
      rollbackRecord.brainDispatchId = undefined;
    }

    run.completedStepIds = run.completedStepIds.filter((id) => id !== input.rollbackStepId);
    run.updatedAt = new Date().toISOString();

    run = recoveryPluginRegistry.applyRollbackPlugins({
      run,
      failedStepId: input.failedStepId,
      rollbackStepId: input.rollbackStepId,
    });

    this.runStore.save(run);

    const rollback: RollbackContext = {
      rollbackId,
      executionId: run.executionId,
      workflowId: run.executionContext.workflowId,
      triggerId: run.executionContext.triggerId,
      correlationId: run.executionContext.correlationId,
      workspaceId: run.executionContext.workspaceId,
      companyId: run.executionContext.companyId,
      brandId: run.executionContext.brandId,
      rollbackStrategyId: input.rollbackStrategyId,
      recoveryStrategyId: input.recoveryStrategyId,
      failureCause: input.failureCause,
      recoveryResult: "rollback_applied",
      timestamp: new Date().toISOString(),
      pillowGovernance: true,
    };

    this.store.saveRollback(rollback);
    return { run, rollback };
  }

  restoreFromSnapshot(run: AutomationRun, snapshot: ExecutionSnapshot): AutomationRun {
    run.completedStepIds = [...snapshot.completedStepIds];
    for (const step of run.steps) {
      const priorState = snapshot.stepStates[step.stepId];
      if (priorState) {
        step.state = priorState as (typeof step)["state"];
      }
    }
    run.executionContext.registryReferences = {
      ...run.executionContext.registryReferences,
      ...(snapshot.registryReferences as typeof run.executionContext.registryReferences),
    };
    run.updatedAt = new Date().toISOString();
    this.runStore.save(run);
    return run;
  }
}

let sharedEngine: RollbackEngine | undefined;

export function getRollbackEngine(): RollbackEngine {
  if (!sharedEngine) {
    sharedEngine = new RollbackEngine();
  }
  return sharedEngine;
}

export function resetRollbackEngineForTests(): void {
  sharedEngine = undefined;
}
