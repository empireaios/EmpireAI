/**
 * G8-03 — Credential vault registry resolver.
 */

import { REG_CONNECTION_POLICY, REG_CREDENTIAL_TYPE, REG_IDENTITY_PROVIDER } from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import { credentialTypeConfigurationSchema } from "../../../../registry/types/identity-authorization-registry-types.js";
import type { IdentityAuthorizationRegistryRowBase } from "../../../../registry/types/identity-authorization-registry-types.js";
import type { VaultCredentialType } from "../contracts/credential-vault-types.js";
import {
  resolveAllConnectionProviders,
  resolveConnectionProvider,
  resolveConnectionRequirements,
  resolveProviderCapabilities,
} from "../../connection-registry/registry/connection-registry-resolver.js";
import { resolveAuthorizationProviders } from "../../registry/identity-authorization-registry-resolver.js";

export type ProviderCredentialRequirements = {
  providerId: string;
  displayName: string;
  credentialTypeId: string;
  credentialKind: VaultCredentialType;
  vaultBackend: string;
  vaultPathTemplate: string;
  rotationPolicyRef: string;
  expiryPolicyRef: string;
  healthPolicyRef: string;
  connectionPolicyRefs: string[];
  registryRefs: string[];
};

export function resolveCredentialTypeForProvider(providerId: string, context: RegistryLoaderContext = {}) {
  const loader = getRegistryLoader();
  const rows = loader.resolve(context, REG_CREDENTIAL_TYPE).rows as IdentityAuthorizationRegistryRowBase[];
  const row = rows.find(
    (entry) => credentialTypeConfigurationSchema.parse(entry.configuration.credentialType).providerId === providerId,
  );
  if (!row) return undefined;
  return credentialTypeConfigurationSchema.parse(row.configuration.credentialType);
}

export function resolveProviderCredentialRequirements(
  providerId: string,
  context: RegistryLoaderContext = {},
): ProviderCredentialRequirements | undefined {
  const credentialType = resolveCredentialTypeForProvider(providerId, context);
  const provider = resolveConnectionProvider(providerId, context);
  const requirement = resolveConnectionRequirements(context).find((r) => r.providerId === providerId);
  if (!credentialType || !provider) return undefined;

  const loader = getRegistryLoader();
  const policyRows = loader.resolve(context, REG_CONNECTION_POLICY).rows.length;
  const identityRows = loader.resolve(context, REG_IDENTITY_PROVIDER).rows.length;

  return {
    providerId,
    displayName: provider.displayName,
    credentialTypeId: credentialType.credentialTypeId,
    credentialKind: (credentialType.credentialKind ?? "api_key") as VaultCredentialType,
    vaultBackend: credentialType.vaultBackend ?? "empire-credential-vault",
    vaultPathTemplate: credentialType.vaultPathTemplate ?? `vault://{workspaceId}/{providerId}/{credentialKind}`,
    rotationPolicyRef: credentialType.rotationPolicyRef ?? `rotation:policy:${providerId}`,
    expiryPolicyRef: credentialType.expiryPolicyRef ?? `expiry:policy:${providerId}`,
    healthPolicyRef: credentialType.healthPolicyRef ?? `health:policy:${providerId}`,
    connectionPolicyRefs: [`REG-CONNECTION-POLICY:${policyRows}`],
    registryRefs: [
      "REG-CREDENTIAL-TYPE",
      "REG-CONNECTION-PROVIDER",
      "REG-CONNECTION-REQUIREMENT",
      "REG-CONNECTION-CAPABILITY",
      "REG-CONNECTION-POLICY",
      ...(identityRows > 0 ? ["REG-IDENTITY-PROVIDER"] : []),
      ...(resolveAuthorizationProviders(context).some((p) => p.providerId === providerId)
        ? ["REG-AUTHORIZATION-PROVIDER"]
        : []),
    ],
  };
}

export function resolveAllProviderCredentialRequirements(context: RegistryLoaderContext = {}) {
  return resolveAllConnectionProviders(context)
    .map((p) => resolveProviderCredentialRequirements(p.providerId, context))
    .filter((entry): entry is ProviderCredentialRequirements => entry !== undefined);
}

export function resolveCredentialCapabilitiesForProvider(providerId: string, context: RegistryLoaderContext = {}) {
  return resolveProviderCapabilities(context).filter((c) => c.providerId === providerId);
}
