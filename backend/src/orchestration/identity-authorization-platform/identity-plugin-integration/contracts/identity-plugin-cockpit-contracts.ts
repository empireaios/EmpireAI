/**
 * G8-09 — Identity plugin Cockpit backend contracts.
 */

import type { IdentityPluginHealthStatus, IdentityPluginLifecycleState } from "./identity-plugin-types.js";
import { getIdentityPluginHost } from "../services/identity-plugin-lifecycle-manager.js";
import { resolveIdentityPluginProviderCoverage } from "../registry/identity-plugin-capability-resolver.js";

export type IdentityPluginCockpitSummary = {
  installedPluginCount: number;
  enabledPluginCount: number;
  failedPluginCount: number;
  providerCoverageCount: number;
  capabilityCount: number;
  warningCount: number;
  errorCount: number;
  correlationId: string;
};

export type IdentityPluginCockpitInstalledPlugin = {
  pluginId: string;
  pluginName: string;
  pluginCategory: string;
  lifecycleState: IdentityPluginLifecycleState;
  healthStatus: IdentityPluginHealthStatus;
  capabilityCount: number;
  providerCoverageCount: number;
  warnings: string[];
  errors: string[];
};

export type IdentityPluginCockpitView = {
  summary: IdentityPluginCockpitSummary;
  installedPlugins: IdentityPluginCockpitInstalledPlugin[];
  capabilityList: string[];
  providerCoverage: string[];
  warnings: string[];
  errors: string[];
  computedAt: string;
};

export function buildIdentityPluginCockpitView(input: {
  workspaceId: string;
  actorId: string;
  ownerId: string;
  pillowGovernance: true;
  correlationId?: string;
}): IdentityPluginCockpitView {
  const host = getIdentityPluginHost();
  const records = host.listPlugins({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    pillowGovernance: true,
  });

  const workspaceRecords = records.filter((record) => record.workspaceId === input.workspaceId);
  const enabled = workspaceRecords.filter((record) => record.status === "enabled" || record.status === "loaded");
  const failed = workspaceRecords.filter((record) => record.status === "failed");

  const capabilitySet = new Set<string>();
  const providerSet = new Set<string>();
  const warnings: string[] = [];
  const errors: string[] = [];

  const installedPlugins: IdentityPluginCockpitInstalledPlugin[] = workspaceRecords.map((record) => {
    for (const capability of record.capabilities) capabilitySet.add(capability);
    const coverage = resolveIdentityPluginProviderCoverage(record);
    for (const providerId of coverage) providerSet.add(providerId);
    warnings.push(...record.warnings);
    errors.push(...record.errors);

    return {
      pluginId: record.pluginId,
      pluginName: record.pluginName,
      pluginCategory: record.pluginCategory,
      lifecycleState: record.status,
      healthStatus: record.healthStatus,
      capabilityCount: record.capabilities.length,
      providerCoverageCount: coverage.length,
      warnings: record.warnings,
      errors: record.errors,
    };
  });

  return {
    summary: {
      installedPluginCount: workspaceRecords.length,
      enabledPluginCount: enabled.length,
      failedPluginCount: failed.length,
      providerCoverageCount: providerSet.size,
      capabilityCount: capabilitySet.size,
      warningCount: warnings.length,
      errorCount: errors.length,
      correlationId: input.correlationId ?? `g809-cockpit-${Date.now()}`,
    },
    installedPlugins,
    capabilityList: [...capabilitySet],
    providerCoverage: [...providerSet],
    warnings,
    errors,
    computedAt: new Date().toISOString(),
  };
}
