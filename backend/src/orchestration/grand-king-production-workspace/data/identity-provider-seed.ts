/**
 * G7-02 — Identity provider seed (REG-IDENTITY-PROVIDER).
 */

import {
  PRODUCTION_WORKSPACE_REGISTRY_VERSION,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../registry/types/production-workspace-registry-types.js";

export const IDENTITY_PROVIDER_SEED_ROWS: ProductionWorkspaceRegistryRowBase[] = [
  {
    id: "identity-provider-grand-king",
    name: "Grand King identity provider",
    description: "Production identity authorization reference for Grand King commerce operations",
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-TENANT"],
    capabilities: ["authorize"],
    configuration: {
      identityProvider: {
        schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION,
        providerId: "grand-king-identity",
        providerName: "Grand King Identity",
        providerKind: "identity",
        registryRef: "REG-TENANT",
        authorizationScopes: ["commerce-operate", "production-workspace"],
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: PRODUCTION_WORKSPACE_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Reference only — no credentials stored" },
  },
];
