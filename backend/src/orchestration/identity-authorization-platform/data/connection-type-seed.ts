/**
 * G8-00 — Connection type seed (REG-CONNECTION-TYPE).
 */

import {
  FOUNDATION_PROVIDER_IDS,
  IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
  type FoundationProviderId,
  type IdentityAuthorizationRegistryRowBase,
} from "../../../registry/types/identity-authorization-registry-types.js";

function connectionTypeRow(providerId: FoundationProviderId): IdentityAuthorizationRegistryRowBase {
  return {
    id: `connection-type-${providerId}`,
    name: `${providerId} connection type`,
    description: `Configurable connection type for ${providerId}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-CONNECTION-POLICY"],
    capabilities: ["connect"],
    configuration: {
      connectionType: {
        schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
        connectionTypeId: `connection:${providerId}`,
        connectionTypeName: `${providerId} connection`,
        providerId,
        configurable: true,
        defaultState: "configured",
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Connection state only — no OAuth in G8-00" },
  };
}

export const CONNECTION_TYPE_SEED_ROWS: IdentityAuthorizationRegistryRowBase[] =
  FOUNDATION_PROVIDER_IDS.map(connectionTypeRow);
