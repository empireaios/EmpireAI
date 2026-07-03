/**
 * G8-04 — Connection health plugin host.
 */

import {
  connectionHealthPluginManifestSchema,
  type ConnectionHealthPluginManifest,
} from "../contracts/connection-health-types.js";
import { validateConnectionHealthPillowGovernance } from "../governance/connection-health-pillow-governance.js";

const plugins = new Map<string, { manifest: ConnectionHealthPluginManifest }>();

export function registerConnectionHealthPlugin(input: {
  manifest: ConnectionHealthPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = connectionHealthPluginManifestSchema.parse(input.manifest);
  const governance = validateConnectionHealthPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    operation: "check",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, pluginId: manifest.pluginId, reason: governance.reason };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Connection health plugin registered" };
}

export function listConnectionHealthPlugins(): ConnectionHealthPluginManifest[] {
  return Array.from(plugins.values()).map((entry) => entry.manifest);
}

export function listConnectionHealthPluginsByKind(
  kind: ConnectionHealthPluginManifest["pluginKind"],
): ConnectionHealthPluginManifest[] {
  return listConnectionHealthPlugins().filter((manifest) => manifest.pluginKind === kind);
}

export function resetConnectionHealthPluginHostForTests(): void {
  plugins.clear();
}
