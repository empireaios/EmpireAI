/**
 * G8-08 — Isolation plugin host.
 */

import { isolationPluginManifestSchema, type IsolationPluginManifest } from "../contracts/isolation-types.js";
import { validateIsolationPillowGovernance } from "../governance/isolation-pillow-governance.js";

const plugins = new Map<string, { manifest: IsolationPluginManifest }>();

export function registerIsolationPlugin(input: {
  manifest: IsolationPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}) {
  const manifest = isolationPluginManifestSchema.parse(input.manifest);
  const governance = validateIsolationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "plugin",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, pluginId: manifest.pluginId, reason: governance.reason };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Isolation plugin registered within boundary" };
}

export function listIsolationPlugins(): IsolationPluginManifest[] {
  return Array.from(plugins.values()).map((e) => e.manifest);
}

export function listIsolationPluginsByKind(kind: IsolationPluginManifest["pluginKind"]) {
  return listIsolationPlugins().filter((m) => m.pluginKind === kind);
}

export function resetIsolationPluginHostForTests(): void {
  plugins.clear();
}
