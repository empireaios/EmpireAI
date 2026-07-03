/**
 * G5-04 — Registry-driven workflow DAG resolution (no hardcoded sequences).
 */

import type {
  AutomationPolicyRow,
  AutomationRecoveryRow,
  AutomationWorkflowRow,
} from "../../../registry/types/automation-registry-types.js";
import {
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_RECOVERY,
  REG_AUTOMATION_WORKFLOW,
} from "../../../registry/types/registry-ids.js";
import type { ResolvedWorkflowDefinition, ResolvedWorkflowStep } from "../contracts/orchestrator-types.js";
import { resolveAutomationRegistry } from "../registry/automation-registry-resolver.js";

function readStepCondition(
  workflow: AutomationWorkflowRow,
  stepId: string,
): string | undefined {
  const stepConfig = workflow.configuration?.steps;
  if (!stepConfig || typeof stepConfig !== "object") return undefined;
  const entry = (stepConfig as Record<string, unknown>)[stepId];
  if (!entry || typeof entry !== "object") return undefined;
  const condition = (entry as Record<string, unknown>).condition;
  return typeof condition === "string" ? condition : undefined;
}

export function topologicalSort(steps: ResolvedWorkflowStep[]): string[] {
  const rollbackTargets = new Set(
    steps.flatMap((step) => (step.rollbackStepId ? [step.rollbackStepId] : [])),
  );
  const forwardSteps = steps.filter((step) => {
    const isRollbackOnly =
      step.dependsOn.length === 0 &&
      rollbackTargets.has(step.stepId) &&
      !steps.some((candidate) => candidate.dependsOn.includes(step.stepId));
    return !isRollbackOnly;
  });

  const stepIds = new Set(forwardSteps.map((step) => step.stepId));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const step of forwardSteps) {
    inDegree.set(step.stepId, 0);
    adjacency.set(step.stepId, []);
  }

  for (const step of forwardSteps) {
    for (const dep of step.dependsOn) {
      if (!stepIds.has(dep)) {
        throw new Error(`Workflow dependency missing step: ${dep}`);
      }
      adjacency.get(dep)!.push(step.stepId);
      inDegree.set(step.stepId, (inDegree.get(step.stepId) ?? 0) + 1);
    }
  }

  const queue = [...inDegree.entries()]
    .filter(([, degree]) => degree === 0)
    .map(([stepId]) => stepId)
    .sort();
  const order: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    order.push(current);
    for (const next of adjacency.get(current) ?? []) {
      const degree = (inDegree.get(next) ?? 0) - 1;
      inDegree.set(next, degree);
      if (degree === 0) {
        queue.push(next);
        queue.sort();
      }
    }
  }

  if (order.length !== forwardSteps.length) {
    throw new Error("Workflow dependency cycle detected");
  }

  return order;
}

export function resolveWorkflowDefinition(input: {
  workflowId: string;
  workflowVersion: string;
  policyRegistryId?: string;
  recoveryRegistryId?: string;
}): ResolvedWorkflowDefinition {
  const workflows = resolveAutomationRegistry({}, REG_AUTOMATION_WORKFLOW)
    .rows as AutomationWorkflowRow[];
  const policies = resolveAutomationRegistry({}, REG_AUTOMATION_POLICY)
    .rows as AutomationPolicyRow[];
  const recoveries = resolveAutomationRegistry({}, REG_AUTOMATION_RECOVERY)
    .rows as AutomationRecoveryRow[];

  const workflow = workflows.find(
    (row) => row.id === input.workflowId && row.version === input.workflowVersion,
  );
  if (!workflow) {
    throw new Error(
      `Workflow not found in REG-AUTOMATION-WORKFLOW: ${input.workflowId}@${input.workflowVersion}`,
    );
  }

  const policyRow =
    (input.policyRegistryId
      ? policies.find((row) => row.id === input.policyRegistryId)
      : undefined) ??
    (workflow.policyRef ? policies.find((row) => row.id === workflow.policyRef) : undefined);

  const recoveryRow =
    (input.recoveryRegistryId
      ? recoveries.find((row) => row.id === input.recoveryRegistryId)
      : undefined) ??
    recoveries.find((row) => row.workflowRef?.id === workflow.id);

  const steps: ResolvedWorkflowStep[] = workflow.steps.map((step) => ({
    stepId: step.stepId,
    executorType: step.executorType,
    executorRef: step.executorRef,
    dependsOn: step.dependsOn ?? [],
    irreversible: step.irreversible,
    idempotent: step.idempotent,
    rollbackStepId: step.rollbackStepId,
    condition: readStepCondition(workflow, step.stepId),
  }));

  const executionOrder = topologicalSort(steps);

  return {
    workflowId: workflow.id,
    workflowVersion: workflow.version,
    name: workflow.name,
    description: workflow.description,
    purpose: workflow.capabilities.join(", ") || workflow.name,
    steps,
    executionOrder,
    policyRegistryId: policyRow?.id ?? workflow.policyRef,
    approvalRegistryId: workflow.approvalRef,
    recoveryRegistryId: recoveryRow?.id,
    notificationRegistryIds: policyRow?.notificationRefs ?? [],
    reportRegistryIds: [],
  };
}

export function validateWorkflowDependencies(workflow: ResolvedWorkflowDefinition): void {
  const stepIds = new Set(workflow.steps.map((step) => step.stepId));
  for (const step of workflow.steps) {
    for (const dep of step.dependsOn) {
      if (!stepIds.has(dep)) {
        throw new Error(`Missing dependency ${dep} for step ${step.stepId}`);
      }
    }
  }
  topologicalSort(workflow.steps);
}
