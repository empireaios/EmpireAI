/**
 * G7-04 — Executive decision plugin host.
 */

import type { ExecutiveDecisionPluginManifest } from "../contracts/executive-decision-types.js";
import { executiveDecisionPluginManifestSchema } from "../contracts/executive-decision-types.js";

const plugins = new Map<string, { manifest: ExecutiveDecisionPluginManifest }>();

export function registerExecutiveDecisionPlugin(input: {
  manifest: ExecutiveDecisionPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = executiveDecisionPluginManifestSchema.parse(input.manifest);
  if (!input.pillowGovernance) {
    return { accepted: false, pluginId: manifest.pluginId, reason: "Pillow governance required" };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Executive decision plugin registered" };
}

export function resetExecutiveDecisionPluginHostForTests(): void {
  plugins.clear();
}

export function listExecutiveDecisionPlugins(): ExecutiveDecisionPluginManifest[] {
  return [...plugins.values()].map((entry) => entry.manifest);
}
