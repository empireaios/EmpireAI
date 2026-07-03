/**
 * G5-05 — Registry-driven approval policy resolution (no hardcoded chains).
 */

import type {
  AutomationApprovalRow,
  AutomationNotificationRow,
  AutomationPolicyRow,
} from "../../../registry/types/automation-registry-types.js";
import {
  REG_AUTOMATION_APPROVAL,
  REG_AUTOMATION_NOTIFICATION,
  REG_AUTOMATION_POLICY,
} from "../../../registry/types/registry-ids.js";
import type { ResolvedApprovalPolicy } from "../contracts/approval-types.js";
import { resolveAutomationRegistry } from "../registry/automation-registry-resolver.js";

function readNumber(config: Record<string, unknown>, key: string): number | undefined {
  const value = config[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readStringArray(config: Record<string, unknown>, key: string): string[] {
  const value = config[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function resolveApprovalPolicy(input: {
  approvalRegistryId?: string;
  policyRegistryId?: string;
  payload?: Record<string, unknown>;
}): ResolvedApprovalPolicy {
  if (!input.approvalRegistryId) {
    return {
      approvalRegistryId: "unbound",
      tier: "A0",
      required: false,
      notificationRegistryIds: [],
      pillowBridge: true,
      reason: "No approvalRef — A0 implicit for reversible operations",
    };
  }

  const approvalRows = resolveAutomationRegistry({}, REG_AUTOMATION_APPROVAL)
    .rows as AutomationApprovalRow[];
  const policyRows = resolveAutomationRegistry({}, REG_AUTOMATION_POLICY)
    .rows as AutomationPolicyRow[];
  const notificationRows = resolveAutomationRegistry({}, REG_AUTOMATION_NOTIFICATION)
    .rows as AutomationNotificationRow[];

  const approvalRow = approvalRows.find((row) => row.id === input.approvalRegistryId);
  if (!approvalRow) {
    return {
      approvalRegistryId: input.approvalRegistryId,
      tier: "A3",
      required: true,
      notificationRegistryIds: [],
      pillowBridge: false,
      reason: `Approval registry row not found: ${input.approvalRegistryId}`,
    };
  }

  const policyRow =
    (input.policyRegistryId
      ? policyRows.find((row) => row.id === input.policyRegistryId)
      : undefined) ??
    (approvalRow.policyRef ? policyRows.find((row) => row.id === approvalRow.policyRef) : undefined);

  const irreversible = input.payload?.irreversible === true;
  let matchedRule = approvalRow.routingRules.find((rule) => rule.condition === "default");
  if (irreversible) {
    matchedRule =
      approvalRow.routingRules.find((rule) => rule.condition.includes("irreversible")) ??
      matchedRule;
  }

  const tier = matchedRule?.tier ?? approvalRow.tier;
  const configuredNotifications = readStringArray(approvalRow.configuration, "notificationRefs");
  const policyNotifications = policyRow?.notificationRefs ?? [];
  const notificationRegistryIds = [
    ...new Set([...configuredNotifications, ...policyNotifications]),
  ].filter((id) => notificationRows.some((row) => row.id === id));

  const expiryMs =
    readNumber(approvalRow.configuration, "expiryMs") ??
    readNumber(policyRow?.configuration ?? {}, "approvalExpiryMs");

  return {
    approvalRegistryId: approvalRow.id,
    policyRegistryId: policyRow?.id ?? approvalRow.policyRef,
    tier,
    required: tier !== "A0",
    expiryMs,
    notificationRegistryIds,
    pillowBridge: approvalRow.pillowBridge,
    routingRuleId: matchedRule?.ruleId,
    reason:
      tier === "A0"
        ? `Approval tier A0 — Pillow auto (rule: ${matchedRule?.ruleId ?? "default"})`
        : `Approval tier ${tier} required (rule: ${matchedRule?.ruleId ?? "default"})`,
  };
}

export function computeApprovalExpiry(requestedAtIso: string, expiryMs?: number): string | undefined {
  if (!expiryMs) return undefined;
  const start = Date.parse(requestedAtIso);
  if (Number.isNaN(start)) return undefined;
  return new Date(start + expiryMs).toISOString();
}
