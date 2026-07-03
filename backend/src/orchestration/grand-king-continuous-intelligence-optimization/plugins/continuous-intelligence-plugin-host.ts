/**
 * G7-06 — Continuous intelligence plugin host.
 */

import type { OptimizationPluginManifest } from "../contracts/continuous-intelligence-types.js";
import { optimizationPluginManifestSchema } from "../contracts/continuous-intelligence-types.js";

const plugins = new Map<string, { manifest: OptimizationPluginManifest }>();

export function registerContinuousIntelligencePlugin(input: {
  manifest: OptimizationPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = optimizationPluginManifestSchema.parse(input.manifest);
  if (!input.pillowGovernance) {
    return { accepted: false, pluginId: manifest.pluginId, reason: "Pillow governance required" };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Continuous intelligence plugin registered" };
}

export function resetContinuousIntelligencePluginHostForTests(): void {
  plugins.clear();
}

export function listContinuousIntelligencePlugins(): OptimizationPluginManifest[] {
  return [...plugins.values()].map((entry) => entry.manifest);
}
