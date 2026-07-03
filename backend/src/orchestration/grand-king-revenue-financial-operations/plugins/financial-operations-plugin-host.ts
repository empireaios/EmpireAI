/**
 * G7-05 — Financial operations plugin host.
 */

import type { FinancialOperationsPluginManifest } from "../contracts/financial-operations-types.js";
import { financialOperationsPluginManifestSchema } from "../contracts/financial-operations-types.js";

const plugins = new Map<string, { manifest: FinancialOperationsPluginManifest }>();

export function registerFinancialOperationsPlugin(input: {
  manifest: FinancialOperationsPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = financialOperationsPluginManifestSchema.parse(input.manifest);
  if (!input.pillowGovernance) {
    return { accepted: false, pluginId: manifest.pluginId, reason: "Pillow governance required" };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Financial operations plugin registered" };
}

export function resetFinancialOperationsPluginHostForTests(): void {
  plugins.clear();
}

export function listFinancialOperationsPlugins(): FinancialOperationsPluginManifest[] {
  return [...plugins.values()].map((entry) => entry.manifest);
}
