/**
 * G6-10 — Final readiness plugin host.
 */

import type { FinalReadinessPluginManifest } from "../contracts/final-production-readiness-types.js";
import { finalReadinessPluginManifestSchema } from "../contracts/final-production-readiness-types.js";

type PluginEntry = {
  manifest: FinalReadinessPluginManifest;
};

const plugins = new Map<string, PluginEntry>();

export function registerFinalReadinessPlugin(input: {
  manifest: FinalReadinessPluginManifest;
  actorId: string;
  workspaceId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = finalReadinessPluginManifestSchema.parse(input.manifest);
  if (!input.pillowGovernance) {
    return { accepted: false, pluginId: manifest.pluginId, reason: "Pillow governance required" };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Final readiness plugin registered" };
}

export function resetFinalReadinessPluginHostForTests(): void {
  plugins.clear();
}

export function listFinalReadinessPlugins(): FinalReadinessPluginManifest[] {
  return [...plugins.values()].map((entry) => entry.manifest);
}
