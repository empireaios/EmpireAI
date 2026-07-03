/**
 * G5-04 — REG-AUTOMATION-EXECUTOR resolution (no hardcoded engine mappings).
 */

import type { AutomationExecutorRow } from "../../../registry/types/automation-registry-types.js";
import { REG_AUTOMATION_EXECUTOR } from "../../../registry/types/registry-ids.js";
import type { ResolvedWorkflowStep } from "../contracts/orchestrator-types.js";
import { resolveAutomationRegistry } from "../registry/automation-registry-resolver.js";

export type ResolvedExecutorBinding = {
  executorRegistryId?: string;
  executorType: ResolvedWorkflowStep["executorType"];
  executorRef: string;
  module: string;
  action: string;
  moduleBinding?: string;
  capabilityTags: string[];
};

export function parseExecutorRef(executorRef: string): { module: string; action: string } {
  const separator = executorRef.indexOf(":");
  if (separator <= 0 || separator === executorRef.length - 1) {
    throw new Error(`Invalid executorRef format (expected module:action): ${executorRef}`);
  }
  return {
    module: executorRef.slice(0, separator),
    action: executorRef.slice(separator + 1),
  };
}

export function resolveExecutorBinding(step: ResolvedWorkflowStep): ResolvedExecutorBinding {
  const executors = resolveAutomationRegistry({}, REG_AUTOMATION_EXECUTOR)
    .rows as AutomationExecutorRow[];

  const byRef = executors.find((row) => row.executorRef === step.executorRef);
  const byType = executors.find(
    (row) => row.executorType === step.executorType && row.executorRef === step.executorRef,
  );
  const executorRow = byRef ?? byType;

  const bindingRef = executorRow?.moduleBinding ?? step.executorRef;
  const { module, action } = parseExecutorRef(bindingRef);

  return {
    executorRegistryId: executorRow?.id,
    executorType: step.executorType,
    executorRef: step.executorRef,
    module,
    action,
    moduleBinding: executorRow?.moduleBinding,
    capabilityTags: executorRow?.capabilityTags ?? [],
  };
}

/** Business engine executor types dispatch through Brain — never direct engine calls. */
export const BUSINESS_ENGINE_CAPABILITY_TAGS = [
  "marketplace",
  "supplier",
  "storefront",
  "advertising",
  "payment",
  "logistics",
  "analytics",
] as const;
