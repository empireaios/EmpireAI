/**
 * G5-09 — Automation Plugin service (Brain tool handlers).
 */

import type {
  AutomationPluginManifest,
  AutomationPluginRegistrationResult,
} from "../contracts/automation-plugin-types.js";
import type { AutomationPluginHookBundle } from "../plugins/automation-plugin-domain-router.js";
import { getAutomationPluginHost } from "../plugins/automation-plugin-host.js";
import { resolveAutomationPluginRegistryPolicy } from "../plugins/automation-plugin-registry-resolver.js";

export function discoverAutomationPlugins(input: {
  actorId: string;
  workspaceId: string;
}) {
  return getAutomationPluginHost().discoverPlugins({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
  });
}

export function registerAutomationPlugin(input: {
  manifest: AutomationPluginManifest;
  actorId: string;
  workspaceId: string;
  hooks?: AutomationPluginHookBundle;
  killSwitchActive?: boolean;
}): AutomationPluginRegistrationResult {
  return getAutomationPluginHost().registerPlugin({
    manifest: input.manifest,
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    hooks: input.hooks,
    killSwitchActive: input.killSwitchActive,
  });
}

export function enableAutomationPlugin(input: {
  pluginId: string;
  actorId: string;
  workspaceId: string;
}) {
  return getAutomationPluginHost().enablePlugin({
    pluginId: input.pluginId,
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
  });
}

export function disableAutomationPlugin(input: {
  pluginId: string;
  actorId: string;
  workspaceId: string;
}) {
  return getAutomationPluginHost().disablePlugin({
    pluginId: input.pluginId,
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
  });
}

export function unloadAutomationPlugin(input: {
  pluginId: string;
  actorId: string;
  workspaceId: string;
}) {
  return getAutomationPluginHost().unloadPlugin({
    pluginId: input.pluginId,
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
  });
}

export function getAutomationPlugin(pluginId: string) {
  const record = getAutomationPluginHost().getPlugin(pluginId);
  if (!record) return { found: false as const };
  return { found: true as const, record };
}

export function listAutomationPlugins(workspaceId?: string) {
  return {
    totalCount: getAutomationPluginHost().listPlugins(workspaceId).length,
    plugins: getAutomationPluginHost().listPluginSummaries(workspaceId),
    generatedAt: new Date().toISOString(),
  };
}

export function listAutomationPluginCapabilities() {
  return {
    totalCount: getAutomationPluginHost().listEnabledCapabilities().length,
    capabilities: getAutomationPluginHost().listEnabledCapabilities(),
    generatedAt: new Date().toISOString(),
  };
}

export function previewAutomationPluginRegistryPolicy(input: {
  pluginId: string;
  category: AutomationPluginManifest["category"];
  registryReferences: string[];
}) {
  return resolveAutomationPluginRegistryPolicy(input);
}
