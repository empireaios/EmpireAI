/**
 * G8-01 — Extended connection type seed (REG-CONNECTION-TYPE).
 */

import { PROVIDER_META } from "./connection-provider-seed.js";
import {
  CONNECTION_REGISTRY_PROVIDER_IDS,
  CONNECTION_REGISTRY_VERSION,
  type ConnectionRegistryProviderId,
} from "../../../../registry/types/connection-registry-types.js";
import { IDENTITY_AUTHORIZATION_REGISTRY_VERSION } from "../../../../registry/types/identity-authorization-registry-types.js";
import type { IdentityAuthorizationRegistryRowBase } from "../../../../registry/types/identity-authorization-registry-types.js";

function authorizationMethodFor(providerId: ConnectionRegistryProviderId): string {
  const meta = PROVIDER_META[providerId];
  if (meta.supportsOAuth) return "oauth_deferred";
  if (meta.supportsApiKey) return "api_key_deferred";
  return "none_deferred";
}

function connectionTypeRow(providerId: ConnectionRegistryProviderId): IdentityAuthorizationRegistryRowBase {
  return {
    id: `connection-type-${providerId}`,
    name: `${providerId} connection type`,
    description: `G8-01 connection type definition for ${providerId}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-CONNECTION-POLICY", "REG-CONNECTION-REQUIREMENT"],
    capabilities: ["connect"],
    configuration: {
      connectionType: {
        schemaVersion: CONNECTION_REGISTRY_VERSION,
        connectionTypeId: `connection:${providerId}`,
        connectionTypeName: `${PROVIDER_META[providerId].displayName} connection`,
        providerId,
        configurable: true,
        defaultState: "not_configured",
        authorizationMethod: authorizationMethodFor(providerId),
        credentialTypeRef: `credential:${providerId}`,
        requiredScopes: [`scope:${providerId}:operate`],
        permissionSetRefs: [`permission:${providerId}:read`, `permission:${providerId}:write`],
        defaultStatus: "not_configured",
        defaultReadinessStatus: "not_ready",
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "G8-01 connection definition metadata — no live auth" },
  };
}

export const CONNECTION_TYPE_REGISTRY_SEED_ROWS: IdentityAuthorizationRegistryRowBase[] =
  CONNECTION_REGISTRY_PROVIDER_IDS.map(connectionTypeRow);
