/**
 * G8-01 — Connection permission seed (REG-CONNECTION-PERMISSION).
 */

import {
  CONNECTION_REGISTRY_PROVIDER_IDS,
  CONNECTION_REGISTRY_VERSION,
  type ConnectionRegistryProviderId,
  type ConnectionRegistryRowBase,
} from "../../../../registry/types/connection-registry-types.js";

function permissionRows(providerId: ConnectionRegistryProviderId): ConnectionRegistryRowBase[] {
  return (["read", "write"] as const).map((kind) => ({
    id: `connection-permission-${providerId}-${kind}`,
    name: `${providerId} ${kind} permission`,
    description: `${kind} permission for ${providerId}`,
    status: "VALIDATED" as const,
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-CONNECTION-SCOPE"],
    capabilities: ["permission"],
    configuration: {
      connectionPermission: {
        schemaVersion: CONNECTION_REGISTRY_VERSION,
        permissionId: `permission:${providerId}:${kind}`,
        permissionName: `${providerId} ${kind}`,
        providerId,
        permissionKey: `${providerId}:${kind}`,
        scopeRefs: [`scope:${providerId}:operate`],
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CONNECTION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" as const },
    futureCompatibility: { notes: "Permission map only" },
  }));
}

export const CONNECTION_PERMISSION_SEED_ROWS: ConnectionRegistryRowBase[] =
  CONNECTION_REGISTRY_PROVIDER_IDS.flatMap(permissionRows);
