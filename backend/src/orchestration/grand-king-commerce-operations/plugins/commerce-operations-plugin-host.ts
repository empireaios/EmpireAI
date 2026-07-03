/**
 * G7-02 — Commerce operations plugin host.
 */

import type { CommerceOperationsPluginManifest } from "../contracts/commerce-operations-types.js";
import { commerceOperationsPluginManifestSchema } from "../contracts/commerce-operations-types.js";

const plugins = new Map<string, { manifest: CommerceOperationsPluginManifest }>();

export function registerCommerceOperationsPlugin(input: {
  manifest: CommerceOperationsPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = commerceOperationsPluginManifestSchema.parse(input.manifest);
  if (!input.pillowGovernance) {
    return { accepted: false, pluginId: manifest.pluginId, reason: "Pillow governance required" };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Commerce operations plugin registered" };
}

export function resetCommerceOperationsPluginHostForTests(): void {
  plugins.clear();
}

export function listCommerceOperationsPlugins(): CommerceOperationsPluginManifest[] {
  return [...plugins.values()].map((entry) => entry.manifest);
}
