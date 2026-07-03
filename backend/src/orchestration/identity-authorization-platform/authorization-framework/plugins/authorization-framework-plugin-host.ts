/**
 * G8-02 — Authorization framework plugin host.
 */

import {
  authorizationFrameworkPluginManifestSchema,
  type AuthorizationFrameworkPluginManifest,
} from "../contracts/authorization-framework-types.js";
import { validateAuthorizationFrameworkPillowGovernance } from "../governance/authorization-framework-pillow-governance.js";

const plugins = new Map<string, { manifest: AuthorizationFrameworkPluginManifest }>();

export function registerAuthorizationFrameworkPlugin(input: {
  manifest: AuthorizationFrameworkPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = authorizationFrameworkPluginManifestSchema.parse(input.manifest);
  const governance = validateAuthorizationFrameworkPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    operation: "start",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, pluginId: manifest.pluginId, reason: governance.reason };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Authorization framework plugin registered" };
}

export function listAuthorizationFrameworkPlugins(): AuthorizationFrameworkPluginManifest[] {
  return Array.from(plugins.values()).map((entry) => entry.manifest);
}

export function resetAuthorizationFrameworkPluginHostForTests(): void {
  plugins.clear();
}
