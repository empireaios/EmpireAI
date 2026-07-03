/**
 * G5-08 — Registry-driven outcome learning policy (REPORT / POLICY / MONITOR).
 */

import type {
  AutomationMonitorRow,
  AutomationPolicyRow,
  AutomationReportRow,
} from "../../../registry/types/automation-registry-types.js";
import {
  REG_AUTOMATION_MONITOR,
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_REPORT,
} from "../../../registry/types/registry-ids.js";
import type { ResolvedOutcomePolicy } from "../contracts/ekls-outcome-types.js";
import { resolveAutomationRegistry } from "../registry/automation-registry-resolver.js";

export function resolveOutcomePolicy(input: {
  workflowId: string;
  policyRegistryId?: string;
}): ResolvedOutcomePolicy {
  const reports = resolveAutomationRegistry({}, REG_AUTOMATION_REPORT)
    .rows as AutomationReportRow[];
  const policies = resolveAutomationRegistry({}, REG_AUTOMATION_POLICY)
    .rows as AutomationPolicyRow[];
  const monitors = resolveAutomationRegistry({}, REG_AUTOMATION_MONITOR)
    .rows as AutomationMonitorRow[];

  const matchingReports = reports.filter((row) =>
    row.dependencies.includes(input.workflowId),
  );

  const policyRow = input.policyRegistryId
    ? policies.find((row) => row.id === input.policyRegistryId)
    : undefined;

  const matchingMonitors = monitors.filter((row) =>
    row.dependencies.includes(input.workflowId) ||
    (input.policyRegistryId && row.policyRef === input.policyRegistryId),
  );

  return {
    reportRegistryIds: matchingReports.map((row) => row.id),
    reportHooks: matchingReports.flatMap((row) => row.hooks),
    monitorRegistryIds: matchingMonitors.map((row) => row.id),
    policyRegistryId: policyRow?.id ?? input.policyRegistryId,
    retentionPolicyRef: policyRow?.id,
  };
}
