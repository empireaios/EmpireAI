/**
 * G8-01 — Connection capability seed (REG-CONNECTION-CAPABILITY).
 */

import {
  CONNECTION_REGISTRY_PROVIDER_IDS,
  CONNECTION_REGISTRY_VERSION,
  type ConnectionRegistryProviderId,
  type ConnectionRegistryRowBase,
} from "../../../../registry/types/connection-registry-types.js";

function capabilityRow(providerId: ConnectionRegistryProviderId): ConnectionRegistryRowBase {
  return {
    id: `connection-capability-${providerId}`,
    name: `${providerId} connection capability`,
    description: `Provider capability definition for ${providerId}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-CONNECTION-PROVIDER"],
    capabilities: ["capability"],
    configuration: {
      connectionCapability: {
        schemaVersion: CONNECTION_REGISTRY_VERSION,
        capabilityId: `capability:${providerId}`,
        capabilityName: `${providerId} operate capability`,
        providerId,
        capabilityKey: `${providerId}:operate`,
        supportedEnvironments: ["sandbox", "production"],
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CONNECTION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Capability metadata only" },
  };
}

export const CONNECTION_CAPABILITY_SEED_ROWS: ConnectionRegistryRowBase[] =
  CONNECTION_REGISTRY_PROVIDER_IDS.map(capabilityRow);
