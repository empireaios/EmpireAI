/**
 * G7-08 — Self-healing plugin host.
 */

import type { SelfHealingPluginManifest } from "../contracts/self-healing-types.js";
import { selfHealingPluginManifestSchema } from "../contracts/self-healing-types.js";

const plugins = new Map<string, { manifest: SelfHealingPluginManifest }>();

export function registerSelfHealingPlugin(input: {
  manifest: SelfHealingPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = selfHealingPluginManifestSchema.parse(input.manifest);
  if (!input.pillowGovernance) {
    return { accepted: false, pluginId: manifest.pluginId, reason: "Pillow governance required" };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Self-healing plugin registered" };
}

export function resetSelfHealingPluginHostForTests(): void {
  plugins.clear();
}

export function listSelfHealingPlugins(): SelfHealingPluginManifest[] {
  return [...plugins.values()].map((e) => e.manifest);
}
