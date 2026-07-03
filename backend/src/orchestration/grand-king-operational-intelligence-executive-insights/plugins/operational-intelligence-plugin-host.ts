/**
 * G7-09 — Operational intelligence plugin host.
 */

import {
  operationalIntelligencePluginManifestSchema,
  type OperationalIntelligencePluginManifest,
} from "../contracts/operational-intelligence-types.js";

const plugins = new Map<string, { manifest: OperationalIntelligencePluginManifest }>();

export function registerOperationalIntelligencePlugin(input: {
  manifest: OperationalIntelligencePluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = operationalIntelligencePluginManifestSchema.parse(input.manifest);
  if (!input.pillowGovernance) {
    return { accepted: false, pluginId: manifest.pluginId, reason: "Pillow governance required" };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Operational intelligence plugin registered" };
}

export function listOperationalIntelligencePlugins(): OperationalIntelligencePluginManifest[] {
  return Array.from(plugins.values()).map((entry) => entry.manifest);
}

export function resetOperationalIntelligencePluginHostForTests(): void {
  plugins.clear();
}
