/**
 * G8-00 — Credential type seed (REG-CREDENTIAL-TYPE).
 */

import {
  FOUNDATION_PROVIDER_IDS,
  IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
  type FoundationProviderId,
  type IdentityAuthorizationRegistryRowBase,
} from "../../../registry/types/identity-authorization-registry-types.js";

function credentialRow(providerId: FoundationProviderId): IdentityAuthorizationRegistryRowBase {
  return {
    id: `credential-type-${providerId}`,
    name: `${providerId} credential type`,
    description: `Configurable credential type reference for ${providerId} — vault deferred to G8-02+`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-AUTHORIZATION-PROVIDER"],
    capabilities: ["credential-reference"],
    configuration: {
      credentialType: {
        schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
        credentialTypeId: `credential:${providerId}`,
        credentialTypeName: `${providerId} credentials`,
        providerId,
        configurable: true,
        storageDeferred: true,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "No credential vault in G8-00" },
  };
}

export const CREDENTIAL_TYPE_SEED_ROWS: IdentityAuthorizationRegistryRowBase[] =
  FOUNDATION_PROVIDER_IDS.map(credentialRow);
