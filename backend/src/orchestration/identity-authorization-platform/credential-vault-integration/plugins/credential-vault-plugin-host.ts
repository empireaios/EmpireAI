/**
 * G8-03 — Credential vault plugin host.
 */

import {
  credentialVaultPluginManifestSchema,
  type CredentialVaultPluginManifest,
} from "../contracts/credential-vault-types.js";
import { validateCredentialVaultPillowGovernance } from "../governance/credential-vault-pillow-governance.js";

const plugins = new Map<string, { manifest: CredentialVaultPluginManifest }>();

export function registerCredentialVaultPlugin(input: {
  manifest: CredentialVaultPluginManifest;
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  pillowGovernance: true;
}): { accepted: boolean; pluginId: string; reason: string } {
  const manifest = credentialVaultPluginManifestSchema.parse(input.manifest);
  const governance = validateCredentialVaultPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    operation: "handoff",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    return { accepted: false, pluginId: manifest.pluginId, reason: governance.reason };
  }
  plugins.set(manifest.pluginId, { manifest });
  return { accepted: true, pluginId: manifest.pluginId, reason: "Credential vault plugin registered" };
}

export function listCredentialVaultPlugins(): CredentialVaultPluginManifest[] {
  return Array.from(plugins.values()).map((entry) => entry.manifest);
}

export function listCredentialVaultPluginsByKind(
  kind: CredentialVaultPluginManifest["pluginKind"],
): CredentialVaultPluginManifest[] {
  return listCredentialVaultPlugins().filter((manifest) => manifest.pluginKind === kind);
}

export function resetCredentialVaultPluginHostForTests(): void {
  plugins.clear();
}
