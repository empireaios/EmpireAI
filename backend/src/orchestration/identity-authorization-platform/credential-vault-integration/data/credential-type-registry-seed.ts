/**
 * G8-03 — Extended credential type seed (REG-CREDENTIAL-TYPE).
 */

import { AUTHORIZATION_TYPE_REFS } from "../../connection-registry/data/connection-requirement-seed.js";
import { CONNECTION_REGISTRY_PROVIDER_IDS } from "../../../../registry/types/connection-registry-types.js";
import type { ConnectionRegistryProviderId } from "../../../../registry/types/connection-registry-types.js";
import {
  IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
  type IdentityAuthorizationRegistryRowBase,
} from "../../../../registry/types/identity-authorization-registry-types.js";
import type { VaultCredentialType } from "../../credential-vault-integration/contracts/credential-vault-types.js";

const CREDENTIAL_KIND_BY_AUTH: Record<string, VaultCredentialType> = {
  lwa: "lwa_client_secret",
  oauth2: "oauth_client_secret",
  api_key: "api_key",
  secret_key: "secret_key",
  webhook_secret: "webhook_secret",
};

function resolveCredentialKind(providerId: ConnectionRegistryProviderId): VaultCredentialType {
  const authType = AUTHORIZATION_TYPE_REFS[providerId];
  if (authType === "lwa") return "lwa_client_secret";
  if (authType === "oauth2") return "oauth_client_secret";
  if (providerId === "stripe") return "secret_key";
  return CREDENTIAL_KIND_BY_AUTH[authType] ?? "api_key";
}

function credentialRow(providerId: ConnectionRegistryProviderId): IdentityAuthorizationRegistryRowBase {
  const credentialKind = resolveCredentialKind(providerId);
  return {
    id: `credential-type-${providerId}`,
    name: `${providerId} credential type`,
    description: `G8-03 credential type reference for ${providerId} — vault-governed metadata only`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-AUTHORIZATION-PROVIDER", "REG-CONNECTION-REQUIREMENT"],
    capabilities: ["credential-reference", "vault-handoff"],
    configuration: {
      credentialType: {
        schemaVersion: "g8-03-v1",
        credentialTypeId: `credential:${providerId}`,
        credentialTypeName: `${providerId} credentials`,
        providerId,
        configurable: true,
        storageDeferred: false,
        credentialKind,
        vaultBackend: "empire-credential-vault",
        vaultPathTemplate: `vault://{workspaceId}/{providerId}/{credentialKind}`,
        rotationPolicyRef: `rotation:policy:${providerId}`,
        expiryPolicyRef: `expiry:policy:${providerId}`,
        healthPolicyRef: `health:policy:${providerId}`,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "G8-03 vault integration — references only in IAP" },
  };
}

export const CREDENTIAL_TYPE_REGISTRY_SEED_ROWS: IdentityAuthorizationRegistryRowBase[] =
  CONNECTION_REGISTRY_PROVIDER_IDS.map(credentialRow);

export { resolveCredentialKind };
