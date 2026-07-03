/**
 * G5-06 — Registry-driven recovery policy resolution (no hardcoded paths).
 */

import type {
  AutomationPolicyRow,
  AutomationRecoveryRow,
} from "../../../registry/types/automation-registry-types.js";
import {
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_RECOVERY,
} from "../../../registry/types/registry-ids.js";
import type { FailureCategory, ResolvedRecoveryPolicy } from "../contracts/recovery-types.js";
import { resolveAutomationRegistry } from "../registry/automation-registry-resolver.js";

export function classifyFailureCategory(errorClass?: string): FailureCategory {
  if (!errorClass) return "unexpected_exception";
  const normalized = errorClass.toUpperCase();
  if (normalized.includes("TIMEOUT")) return "timeout";
  if (normalized.includes("GUARDIAN")) return "infrastructure_failure";
  if (normalized.includes("APPROVAL")) return "approval_failure";
  if (normalized.includes("REGISTRY")) return "registry_failure";
  if (normalized.includes("DEPENDENCY")) return "dependency_failure";
  if (normalized.includes("PLUGIN") || normalized.includes("VALIDATION_BLOCK")) return "plugin_failure";
  if (normalized.includes("BRAIN") || normalized.includes("TRANSIENT")) return "execution_failure";
  if (normalized.includes("BUSINESS") || normalized.includes("ENGINE")) return "business_engine_failure";
  return "workflow_failure";
}

export function evaluateRecoveryCondition(
  condition: string | undefined,
  context: Record<string, string | number | boolean | null | undefined>,
): boolean {
  if (!condition?.trim()) return true;

  const trimmed = condition.trim();
  const eqMatch = trimmed.match(/^(\w+(?:\.\w+)*)\s*==\s*(\w+)$/);
  if (eqMatch) {
    const field = eqMatch[1] ?? "";
    const expected = eqMatch[2] ?? "";
    if (field === "error.class") {
      return String(context.errorClass ?? "").toUpperCase() === expected.toUpperCase();
    }
    return String(context[field] ?? "") === expected;
  }

  if (trimmed.includes("rollbackMap.has(stepId)")) {
    return context.rollbackMapHasStep === true;
  }

  if (trimmed.includes("attempts >= maxAttempts")) {
    return Number(context.retryCount ?? 0) >= Number(context.maxAttempts ?? 0);
  }

  return false;
}

export function resolveRecoveryPolicy(input: {
  recoveryRegistryId?: string;
  policyRegistryId?: string;
}): ResolvedRecoveryPolicy {
  const recoveries = resolveAutomationRegistry({}, REG_AUTOMATION_RECOVERY)
    .rows as AutomationRecoveryRow[];
  const policies = resolveAutomationRegistry({}, REG_AUTOMATION_POLICY)
    .rows as AutomationPolicyRow[];

  const recoveryRow = input.recoveryRegistryId
    ? recoveries.find((row) => row.id === input.recoveryRegistryId)
    : recoveries[0];

  const policyRow = input.policyRegistryId
    ? policies.find((row) => row.id === input.policyRegistryId)
    : undefined;

  return {
    recoveryRegistryId: recoveryRow?.id ?? input.recoveryRegistryId,
    policyRegistryId: policyRow?.id ?? input.policyRegistryId,
    maxAttempts: recoveryRow?.maxAttempts ?? policyRow?.retry.maxAttempts ?? 0,
    backoffMs: policyRow?.retry.backoffMs ?? 0,
    notificationRegistryIds: policyRow?.notificationRefs ?? [],
    strategies: recoveryRow?.strategies ?? [],
    rollbackMap: recoveryRow?.rollbackMap ?? {},
  };
}

export function selectRecoveryStrategy(
  policy: ResolvedRecoveryPolicy,
  context: Record<string, string | number | boolean | null | undefined>,
): ResolvedRecoveryPolicy["strategies"][number] | undefined {
  for (const strategy of policy.strategies) {
    if (
      strategy.kind === "retry" &&
      Number(context.retryCount ?? 0) >= Number(context.maxAttempts ?? 0)
    ) {
      continue;
    }
    if (evaluateRecoveryCondition(strategy.condition, context)) {
      return strategy;
    }
  }
  return policy.strategies[policy.strategies.length - 1];
}
