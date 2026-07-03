/**
 * G7-03 — Business automation operations registry resolver.
 */

import {
  REG_AUTOMATION_APPROVAL,
  REG_AUTOMATION_EXECUTOR,
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_RECOVERY,
  REG_AUTOMATION_SCHEDULE,
  REG_AUTOMATION_TRIGGER,
  REG_AUTOMATION_WORKFLOW,
} from "../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import { resolveProductionWorkspaceConfig } from "../../grand-king-production-workspace/registry/production-workspace-registry-resolver.js";
import { resolveReadinessPolicies } from "../../grand-king-production-workspace/registry/production-workspace-registry-resolver.js";
import type { AutomationOperationDependencySummary } from "../contracts/automation-operations-types.js";
import { AUTOMATION_OPERATIONS_DOMAIN_SEED } from "../data/automation-operations-domain-seed.js";

function extractRowIds(rows: Array<{ id: string }>): string[] {
  return rows.map((row) => row.id);
}

export function resolveAutomationOperationDependencies(
  context: RegistryLoaderContext = {},
): AutomationOperationDependencySummary {
  const loader = getRegistryLoader();
  const workspace = resolveProductionWorkspaceConfig(context);
  const policies = resolveReadinessPolicies(context);

  const workflows = loader.resolve(context, REG_AUTOMATION_WORKFLOW).rows as Array<{ id: string }>;
  const automationPolicies = loader.resolve(context, REG_AUTOMATION_POLICY).rows as Array<{ id: string }>;
  const executors = loader.resolve(context, REG_AUTOMATION_EXECUTOR).rows as Array<{ id: string }>;
  const approvals = loader.resolve(context, REG_AUTOMATION_APPROVAL).rows as Array<{ id: string }>;
  const recoveries = loader.resolve(context, REG_AUTOMATION_RECOVERY).rows as Array<{ id: string }>;

  return {
    readinessPolicy: policies[0]?.policyId ?? "REG-READINESS-POLICY",
    workflowRegistry: workspace.automationWorkflowRef ?? REG_AUTOMATION_WORKFLOW,
    policyRegistry: REG_AUTOMATION_POLICY,
    executorRegistry: REG_AUTOMATION_EXECUTOR,
    approvalRegistry: REG_AUTOMATION_APPROVAL,
    recoveryRegistry: REG_AUTOMATION_RECOVERY,
    workflowIds: extractRowIds(workflows),
    policyIds: extractRowIds(automationPolicies),
    executorIds: extractRowIds(executors),
    approvalIds: extractRowIds(approvals),
    recoveryIds: extractRowIds(recoveries),
  };
}

export function listAutomationOperationsRegistryIds(): string[] {
  return [
    REG_AUTOMATION_WORKFLOW,
    REG_AUTOMATION_POLICY,
    REG_AUTOMATION_EXECUTOR,
    REG_AUTOMATION_APPROVAL,
    REG_AUTOMATION_RECOVERY,
    "REG-READINESS-POLICY",
  ];
}

export function resolveAutomationOperationDomains() {
  return AUTOMATION_OPERATIONS_DOMAIN_SEED;
}

export function resolveAutomationRegistryRefs(context: RegistryLoaderContext = {}): {
  workflowId: string;
  triggerId: string;
  queueId: string;
  approvalId: string;
  recoveryId: string;
  policyId: string;
  executorId: string;
} {
  const loader = getRegistryLoader();
  const deps = resolveAutomationOperationDependencies(context);
  const triggers = loader.resolve(context, REG_AUTOMATION_TRIGGER).rows as Array<{ id: string }>;
  const schedules = loader.resolve(context, REG_AUTOMATION_SCHEDULE).rows as Array<{ id: string }>;

  return {
    workflowId: deps.workflowIds[0] ?? "unknown",
    triggerId: triggers[0]?.id ?? "unknown",
    queueId: schedules[0]?.id ?? "unknown",
    approvalId: deps.approvalIds[0] ?? "unknown",
    recoveryId: deps.recoveryIds[0] ?? "unknown",
    policyId: deps.policyIds[0] ?? "unknown",
    executorId: deps.executorIds[0] ?? "unknown",
  };
}
