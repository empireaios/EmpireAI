/**
 * G5-09 — Registry-driven automation plugin policy resolution.
 */

import type {
  AutomationExecutorRow,
  AutomationMonitorRow,
  AutomationPolicyRow,
  AutomationWorkflowRow,
} from "../../../registry/types/automation-registry-types.js";
import {
  REG_AUTOMATION_EXECUTOR,
  REG_AUTOMATION_MONITOR,
  REG_AUTOMATION_POLICY,
  REG_AUTOMATION_WORKFLOW,
} from "../../../registry/types/registry-ids.js";
import type {
  AutomationPluginCategory,
  ResolvedAutomationPluginPolicy,
} from "../contracts/automation-plugin-types.js";
import { resolveAutomationRegistry } from "../registry/automation-registry-resolver.js";

const CATEGORY_PLUGIN_KIND: Partial<Record<AutomationPluginCategory, string>> = {
  automation_trigger: "automation_trigger",
  automation_workflow: "automation_policy",
  automation_scheduler: "automation_scheduler",
  automation_execution: "automation_executor",
  automation_recovery: "automation_recovery",
  automation_monitoring: "automation_monitor",
  automation_notification: "automation_notification",
};

function matchesReference(rowId: string, references: string[]): boolean {
  return references.includes(rowId);
}

function matchesPluginSupport(
  row: { id: string; pluginSupport: { allowPluginRegistration: boolean; pluginKind?: string; pluginId?: string } },
  pluginId: string,
  category: AutomationPluginCategory,
): boolean {
  if (!row.pluginSupport.allowPluginRegistration) return false;
  if (row.pluginSupport.pluginId && row.pluginSupport.pluginId !== pluginId) return false;
  const expectedKind = CATEGORY_PLUGIN_KIND[category];
  if (expectedKind && row.pluginSupport.pluginKind && row.pluginSupport.pluginKind !== expectedKind) {
    return false;
  }
  return true;
}

export function resolveAutomationPluginRegistryPolicy(input: {
  pluginId: string;
  category: AutomationPluginCategory;
  registryReferences: string[];
}): ResolvedAutomationPluginPolicy {
  const executors = resolveAutomationRegistry({}, REG_AUTOMATION_EXECUTOR)
    .rows as AutomationExecutorRow[];
  const workflows = resolveAutomationRegistry({}, REG_AUTOMATION_WORKFLOW)
    .rows as AutomationWorkflowRow[];
  const policies = resolveAutomationRegistry({}, REG_AUTOMATION_POLICY)
    .rows as AutomationPolicyRow[];
  const monitors = resolveAutomationRegistry({}, REG_AUTOMATION_MONITOR)
    .rows as AutomationMonitorRow[];

  const executorRegistryIds = executors
    .filter(
      (row) =>
        matchesReference(row.id, input.registryReferences) ||
        matchesPluginSupport(row, input.pluginId, input.category),
    )
    .map((row) => row.id);

  const workflowRegistryIds = workflows
    .filter(
      (row) =>
        matchesReference(row.id, input.registryReferences) ||
        matchesPluginSupport(row, input.pluginId, input.category),
    )
    .map((row) => row.id);

  const policyRegistryIds = policies
    .filter(
      (row) =>
        matchesReference(row.id, input.registryReferences) ||
        matchesPluginSupport(row, input.pluginId, input.category),
    )
    .map((row) => row.id);

  const monitorRegistryIds = monitors
    .filter(
      (row) =>
        matchesReference(row.id, input.registryReferences) ||
        matchesPluginSupport(row, input.pluginId, input.category),
    )
    .map((row) => row.id);

  const bindingIds = [
    ...executorRegistryIds,
    ...workflowRegistryIds,
    ...policyRegistryIds,
    ...monitorRegistryIds,
  ];

  const allowed = bindingIds.length > 0 || input.registryReferences.length === 0;

  return {
    pluginId: input.pluginId,
    category: input.category,
    executorRegistryIds,
    workflowRegistryIds,
    policyRegistryIds,
    monitorRegistryIds,
    allowed,
    reason:
      bindingIds.length > 0
        ? "Plugin behaviour resolved from REG-AUTOMATION-EXECUTOR, WORKFLOW, POLICY, and MONITOR"
        : input.registryReferences.length > 0
          ? "No registry rows matched plugin references"
          : "Plugin registered without explicit registry bindings — domain hooks only",
  };
}
