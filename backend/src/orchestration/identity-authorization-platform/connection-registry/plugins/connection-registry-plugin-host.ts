/**
 * G8-01 — Connection registry plugin host.
 */

import {
  connectionRegistryPluginManifestSchema,
  type ConnectionRegistryPluginManifest,
} from "../../../../registry/types/connection-registry-types.js";
import { validateConnectionRegistryPillowGovernance } from "../governance/connection-registry-pillow-governance.js";

const plugins = new Map<string, { manifest: ConnectionRegistryPluginManifest }>();

export function registerConnectionRegistryPlugin(input: {
  manifest: ConnectionRegistryPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = connectionRegistryPluginManifestSchema.parse(input.manifest);
  const governance = validateConnectionRegistryPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "register",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, pluginId: manifest.pluginId, reason: governance.reason };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Connection registry plugin registered" };
}

export function listConnectionRegistryPlugins(): ConnectionRegistryPluginManifest[] {
  return Array.from(plugins.values()).map((entry) => entry.manifest);
}

export function resetConnectionRegistryPluginHostForTests(): void {
  plugins.clear();
}
