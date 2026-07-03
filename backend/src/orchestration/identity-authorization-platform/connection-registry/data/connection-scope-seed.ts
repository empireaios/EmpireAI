/**
 * G8-01 — Connection scope seed (REG-CONNECTION-SCOPE).
 */

import {
  CONNECTION_REGISTRY_PROVIDER_IDS,
  CONNECTION_REGISTRY_VERSION,
  type ConnectionRegistryProviderId,
  type ConnectionRegistryRowBase,
} from "../../../../registry/types/connection-registry-types.js";

function scopeRow(providerId: ConnectionRegistryProviderId): ConnectionRegistryRowBase {
  return {
    id: `connection-scope-${providerId}-operate`,
    name: `${providerId} operate scope`,
    description: `Default operate scope for ${providerId}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-CONNECTION-PROVIDER"],
    capabilities: ["scope"],
    configuration: {
      connectionScope: {
        schemaVersion: CONNECTION_REGISTRY_VERSION,
        scopeId: `scope:${providerId}:operate`,
        scopeName: `${providerId} operate`,
        providerId,
        scopeKey: `${providerId}:operate`,
        description: `Operational scope for ${providerId}`,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CONNECTION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Scope map only — no OAuth" },
  };
}

export const CONNECTION_SCOPE_SEED_ROWS: ConnectionRegistryRowBase[] =
  CONNECTION_REGISTRY_PROVIDER_IDS.map(scopeRow);
