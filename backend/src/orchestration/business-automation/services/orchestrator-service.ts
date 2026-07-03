/**
 * G5-04 — Orchestrator service (Brain tool handlers).
 */

import type { RunSnapshot } from "../contracts/orchestrator-types.js";
import { getAutomationRunStore } from "../state/automation-run-store.js";
import { getWorkflowOrchestrator } from "../orchestrator/workflow-orchestrator.js";
import { resolveWorkflowDefinition } from "../orchestrator/dag-resolver.js";

export async function pickupWaitingAutomation(input: {
  actorId: string;
  workspaceId: string;
  queueId?: string;
  killSwitchActive?: boolean;
}): Promise<{ executionId: string; lifecycleState: string; queueId: string }> {
  const run = getWorkflowOrchestrator().pickupWaiting({
    actorId: input.actorId,
    pillowGovernance: true,
    queueId: input.queueId,
    killSwitchActive: input.killSwitchActive,
  });
  return {
    executionId: run.executionId,
    lifecycleState: run.lifecycleState,
    queueId: run.queueId,
  };
}

export async function advanceAutomationRun(input: {
  executionId: string;
  actorId: string;
  workspaceId: string;
  killSwitchActive?: boolean;
}): Promise<{ executionId: string; lifecycleState: string; completedStepIds: string[] }> {
  const run = await getWorkflowOrchestrator().advanceRun(input.executionId, {
    actorId: input.actorId,
    pillowGovernance: true,
    killSwitchActive: input.killSwitchActive,
  });
  return {
    executionId: run.executionId,
    lifecycleState: run.lifecycleState,
    completedStepIds: [...run.completedStepIds],
  };
}

export async function runAutomationToCompletion(input: {
  executionId: string;
  actorId: string;
  workspaceId: string;
  maxSteps?: number;
}): Promise<{ executionId: string; lifecycleState: string; completedStepIds: string[] }> {
  const orchestrator = getWorkflowOrchestrator();
  let run = orchestrator.getRun(input.executionId);
  if (!run) {
    throw new Error(`Automation run not found: ${input.executionId}`);
  }

  const maxSteps = input.maxSteps ?? run.workflow.steps.length + 2;
  for (let i = 0; i < maxSteps; i += 1) {
    if (
      run.lifecycleState === "workflow_completed" ||
      run.lifecycleState === "workflow_failed" ||
      run.lifecycleState === "workflow_cancelled" ||
      run.lifecycleState === "step_waiting"
    ) {
      break;
    }
    run = await orchestrator.advanceRun(run.executionId, {
      actorId: input.actorId,
      pillowGovernance: true,
    });
  }

  return {
    executionId: run.executionId,
    lifecycleState: run.lifecycleState,
    completedStepIds: [...run.completedStepIds],
  };
}

export function getAutomationRunStatus(executionId: string) {
  const run = getWorkflowOrchestrator().getRun(executionId);
  if (!run) return { found: false as const };
  return {
    found: true as const,
    executionId: run.executionId,
    queueId: run.queueId,
    lifecycleState: run.lifecycleState,
    workflowId: run.executionContext.workflowId,
    correlationId: run.executionContext.correlationId,
    completedStepIds: run.completedStepIds,
    activeStepId: run.activeStepId,
    steps: run.steps,
  };
}

export function getAutomationRunSnapshot(workspaceId?: string): RunSnapshot {
  return getAutomationRunStore().snapshot(workspaceId);
}

export function previewWorkflowDefinition(input: {
  workflowId: string;
  workflowVersion: string;
  policyRegistryId?: string;
  recoveryRegistryId?: string;
}) {
  return resolveWorkflowDefinition(input);
}

export async function cancelAutomationRun(input: {
  executionId: string;
  actorId: string;
  workspaceId: string;
}): Promise<{ executionId: string; lifecycleState: string }> {
  const run = getWorkflowOrchestrator().cancelRun(input.executionId, input.actorId);
  return { executionId: run.executionId, lifecycleState: run.lifecycleState };
}

export async function pauseAutomationRun(input: {
  executionId: string;
  actorId: string;
  workspaceId: string;
}): Promise<{ executionId: string; lifecycleState: string }> {
  const run = getWorkflowOrchestrator().pauseRun(input.executionId, input.actorId);
  return { executionId: run.executionId, lifecycleState: run.lifecycleState };
}
