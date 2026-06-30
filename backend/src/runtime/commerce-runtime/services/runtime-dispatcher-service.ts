import { randomUUID } from "node:crypto";

import { COMMERCE_RUNTIME_EXECUTION_BLOCKED } from "../contract/commerce-runtime-module.js";
import type { ExecutionPlan } from "../models/execution-plan.js";
import { getCommerceRuntimeRepository } from "../repositories/sqlite-commerce-runtime-repository.js";

export type DispatchResult = {
  dispatchId: string;
  planId: string;
  status: "BLOCKED";
  executionBlocked: typeof COMMERCE_RUNTIME_EXECUTION_BLOCKED;
  routedSteps: Array<{
    stepOrder: number;
    kernel: string;
    adapterId?: string;
    action: string;
    interfaceTarget: string;
  }>;
  message: string;
  dispatchedAt: string;
};

export function dispatchApprovedPlan(plan: ExecutionPlan): DispatchResult {
  const routedSteps = plan.steps.map((step) => ({
    stepOrder: step.stepOrder,
    kernel: step.kernel,
    adapterId: step.adapterId,
    action: step.action,
    interfaceTarget: `I${step.kernel.charAt(0).toUpperCase()}${step.kernel.slice(1)}Adapter`,
  }));

  const result: DispatchResult = {
    dispatchId: randomUUID(),
    planId: plan.planId,
    status: "BLOCKED",
    executionBlocked: COMMERCE_RUNTIME_EXECUTION_BLOCKED,
    routedSteps,
    message: "CRT-001 — plan routed to adapter interfaces; live execution blocked",
    dispatchedAt: new Date().toISOString(),
  };

  getCommerceRuntimeRepository().saveQueueEntry({
    queueId: result.dispatchId,
    workspaceId: plan.workspaceId,
    companyId: plan.companyId,
    operation: plan.operation,
    kernel: plan.steps[0]?.kernel ?? "marketplace",
    status: "BLOCKED",
    recordJson: JSON.stringify(result),
    requestedAt: result.dispatchedAt,
  });

  return result;
}

export function dispatchPlanById(planId: string, workspaceId: string, companyId: string): DispatchResult | null {
  const plan = getCommerceRuntimeRepository().getPlan(planId, workspaceId, companyId);
  if (!plan) return null;
  return dispatchApprovedPlan(plan);
}
