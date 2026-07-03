/**
 * G8-01 — Connection dependency seed (REG-CONNECTION-DEPENDENCY).
 */

import { PROVIDER_META } from "./connection-provider-seed.js";
import {
  CONNECTION_REGISTRY_PROVIDER_IDS,
  CONNECTION_REGISTRY_VERSION,
  type ConnectionRegistryProviderId,
  type ConnectionRegistryRowBase,
} from "../../../../registry/types/connection-registry-types.js";

function dependencyRow(providerId: ConnectionRegistryProviderId): ConnectionRegistryRowBase {
  const meta = PROVIDER_META[providerId];
  const primaryRef = meta.dependencies[0] ?? "REG-CONNECTION-PROVIDER";
  return {
    id: `connection-dependency-${providerId}`,
    name: `${providerId} connection dependency`,
    description: `Registry dependency rules for ${providerId}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: [primaryRef],
    capabilities: ["dependency"],
    configuration: {
      connectionDependency: {
        schemaVersion: CONNECTION_REGISTRY_VERSION,
        dependencyId: `dependency:${providerId}`,
        dependencyName: `${providerId} registry dependency`,
        providerId,
        dependsOnRegistryRef: primaryRef,
        dependencyKind: "registry",
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CONNECTION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Dependency rules only" },
  };
}

export const CONNECTION_DEPENDENCY_SEED_ROWS: ConnectionRegistryRowBase[] =
  CONNECTION_REGISTRY_PROVIDER_IDS.map(dependencyRow);
