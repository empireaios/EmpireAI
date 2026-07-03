/**
 * G7-10 — Final live launch plugin host.
 */

import {
  finalLiveLaunchPluginManifestSchema,
  type FinalLiveLaunchPluginManifest,
} from "../contracts/final-live-operations-certification-types.js";

const plugins = new Map<string, { manifest: FinalLiveLaunchPluginManifest }>();

export function registerFinalLiveLaunchPlugin(input: {
  manifest: FinalLiveLaunchPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = finalLiveLaunchPluginManifestSchema.parse(input.manifest);
  if (!input.pillowGovernance) {
    return { accepted: false, pluginId: manifest.pluginId, reason: "Pillow governance required" };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Final live launch plugin registered" };
}

export function listFinalLiveLaunchPlugins(): FinalLiveLaunchPluginManifest[] {
  return Array.from(plugins.values()).map((entry) => entry.manifest);
}

export function resetFinalLiveLaunchPluginHostForTests(): void {
  plugins.clear();
}
