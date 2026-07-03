/**
 * G8-00 — Identity authorization plugin host.
 */

import {
  identityAuthorizationPluginManifestSchema,
  type IdentityAuthorizationPluginManifest,
} from "../contracts/identity-authorization-types.js";
import { validateIdentityAuthorizationPillowGovernance } from "../governance/identity-authorization-pillow-governance.js";

const plugins = new Map<string, { manifest: IdentityAuthorizationPluginManifest }>();

export function registerIdentityAuthorizationPlugin(input: {
  manifest: IdentityAuthorizationPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = identityAuthorizationPluginManifestSchema.parse(input.manifest);
  const governance = validateIdentityAuthorizationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "configure",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, pluginId: manifest.pluginId, reason: governance.reason };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Identity authorization plugin registered" };
}

export function listIdentityAuthorizationPlugins(): IdentityAuthorizationPluginManifest[] {
  return Array.from(plugins.values()).map((entry) => entry.manifest);
}

export function resetIdentityAuthorizationPluginHostForTests(): void {
  plugins.clear();
}
