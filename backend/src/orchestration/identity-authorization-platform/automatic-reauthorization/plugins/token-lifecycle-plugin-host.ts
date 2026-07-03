/**
 * G8-07 — Token lifecycle plugin host.
 */

import {
  tokenLifecyclePluginManifestSchema,
  type TokenLifecyclePluginManifest,
} from "../contracts/token-lifecycle-types.js";
import { validateTokenLifecyclePillowGovernance } from "../governance/token-lifecycle-pillow-governance.js";

const plugins = new Map<string, { manifest: TokenLifecyclePluginManifest }>();

export function registerTokenLifecyclePlugin(input: {
  manifest: TokenLifecyclePluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}) {
  const manifest = tokenLifecyclePluginManifestSchema.parse(input.manifest);
  const governance = validateTokenLifecyclePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "scan",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, pluginId: manifest.pluginId, reason: governance.reason };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Token lifecycle plugin registered" };
}

export function listTokenLifecyclePlugins(): TokenLifecyclePluginManifest[] {
  return Array.from(plugins.values()).map((e) => e.manifest);
}

export function listTokenLifecyclePluginsByKind(kind: TokenLifecyclePluginManifest["pluginKind"]) {
  return listTokenLifecyclePlugins().filter((m) => m.pluginKind === kind);
}

export function resetTokenLifecyclePluginHostForTests(): void {
  plugins.clear();
}
