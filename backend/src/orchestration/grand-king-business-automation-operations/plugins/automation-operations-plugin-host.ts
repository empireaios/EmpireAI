/**
 * G7-03 — Automation operations plugin host.
 */

import type { AutomationOperationsPluginManifest } from "../contracts/automation-operations-types.js";
import { automationOperationsPluginManifestSchema } from "../contracts/automation-operations-types.js";

const plugins = new Map<string, { manifest: AutomationOperationsPluginManifest }>();

export function registerAutomationOperationsPlugin(input: {
  manifest: AutomationOperationsPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = automationOperationsPluginManifestSchema.parse(input.manifest);
  if (!input.pillowGovernance) {
    return { accepted: false, pluginId: manifest.pluginId, reason: "Pillow governance required" };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Automation operations plugin registered" };
}

export function resetAutomationOperationsPluginHostForTests(): void {
  plugins.clear();
}

export function listAutomationOperationsPlugins(): AutomationOperationsPluginManifest[] {
  return [...plugins.values()].map((entry) => entry.manifest);
}
