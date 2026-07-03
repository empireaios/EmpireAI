/**
 * G8-06 — Readiness plugin host.
 */

import { readinessPluginManifestSchema, type ReadinessPluginManifest } from "../contracts/readiness-types.js";
import { validateReadinessPillowGovernance } from "../governance/readiness-pillow-governance.js";

const plugins = new Map<string, { manifest: ReadinessPluginManifest }>();

export function registerReadinessPlugin(input: {
  manifest: ReadinessPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}) {
  const manifest = readinessPluginManifestSchema.parse(input.manifest);
  const governance = validateReadinessPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "evaluate",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, pluginId: manifest.pluginId, reason: governance.reason };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Readiness plugin registered" };
}

export function listReadinessPlugins(): ReadinessPluginManifest[] {
  return Array.from(plugins.values()).map((e) => e.manifest);
}

export function listReadinessPluginsByKind(kind: ReadinessPluginManifest["pluginKind"]) {
  return listReadinessPlugins().filter((m) => m.pluginKind === kind);
}

export function resetReadinessPluginHostForTests(): void {
  plugins.clear();
}
