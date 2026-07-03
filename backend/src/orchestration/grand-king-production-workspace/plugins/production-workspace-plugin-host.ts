/**
 * G7-01 — Production workspace plugin host.
 */

import type { ProductionWorkspacePluginManifest } from "../contracts/production-workspace-types.js";
import { productionWorkspacePluginManifestSchema } from "../contracts/production-workspace-types.js";

const plugins = new Map<string, { manifest: ProductionWorkspacePluginManifest }>();

export function registerProductionWorkspacePlugin(input: {
  manifest: ProductionWorkspacePluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = productionWorkspacePluginManifestSchema.parse(input.manifest);
  if (!input.pillowGovernance) {
    return { accepted: false, pluginId: manifest.pluginId, reason: "Pillow governance required" };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Production workspace plugin registered" };
}

export function resetProductionWorkspacePluginHostForTests(): void {
  plugins.clear();
}

export function listProductionWorkspacePlugins(): ProductionWorkspacePluginManifest[] {
  return [...plugins.values()].map((entry) => entry.manifest);
}
