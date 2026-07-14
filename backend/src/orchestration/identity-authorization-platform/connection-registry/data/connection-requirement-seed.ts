/**
 * G8-01 — Connection requirement seed (REG-CONNECTION-REQUIREMENT).
 * G8-02 — Extended with authorizationType per provider (registry metadata).
 */

import { PROVIDER_META } from "./connection-provider-seed.js";
import {
  CONNECTION_REGISTRY_PROVIDER_IDS,
  CONNECTION_REGISTRY_VERSION,
  type ConnectionRegistryProviderId,
  type ConnectionRegistryRowBase,
} from "../../../../registry/types/connection-registry-types.js";
import type { AuthorizationType } from "../../authorization-framework/contracts/authorization-framework-types.js";

const AUTHORIZATION_TYPE_REFS: Record<ConnectionRegistryProviderId, AuthorizationType> = {
  amazon: "lwa",
  stripe: "api_key",
  meta: "oauth2",
  google: "oauth2",
  shopify: "oauth2",
  tiktok: "oauth2",
  openai: "api_key",
  canva: "oauth2",
  anthropic: "api_key",
  github: "oauth2",
  vercel: "api_key",
  cloudflare: "api_key",
  cjdropshipping: "api_key",
  "email-provider": "oauth2",
  "domain-provider": "api_key",
};

function resolveAuthorizationTypeFromRegistry(providerId: ConnectionRegistryProviderId): AuthorizationType {
  if (AUTHORIZATION_TYPE_REFS[providerId]) {
    return AUTHORIZATION_TYPE_REFS[providerId];
  }
  const meta = PROVIDER_META[providerId];
  if (meta.supportsOAuth) return "oauth2";
  if (meta.supportsApiKey) return "api_key";
  return "future_authorization_type";
}

function requirementRow(providerId: ConnectionRegistryProviderId): ConnectionRegistryRowBase {
  const authorizationType = resolveAuthorizationTypeFromRegistry(providerId);
  return {
    id: `connection-requirement-${providerId}`,
    name: `${providerId} connection requirement`,
    description: `Connection requirements for ${providerId}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-CONNECTION-TYPE", "REG-CONNECTION-SCOPE"],
    capabilities: ["requirement"],
    configuration: {
      connectionRequirement: {
        schemaVersion: CONNECTION_REGISTRY_VERSION,
        requirementId: `requirement:${providerId}`,
        requirementName: `${providerId} connection requirement`,
        providerId,
        connectionTypeRef: `connection:${providerId}`,
        credentialTypeRef: `credential:${providerId}`,
        requiredScopes: [`scope:${providerId}:operate`],
        requiredPermissions: [`permission:${providerId}:read`, `permission:${providerId}:write`],
        accountHolderTypeRef: "grand-king",
        authorizationType,
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: CONNECTION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Requirement metadata only — authorizationType for G8-02" },
  };
}

export const CONNECTION_REQUIREMENT_SEED_ROWS: ConnectionRegistryRowBase[] =
  CONNECTION_REGISTRY_PROVIDER_IDS.map(requirementRow);

export { AUTHORIZATION_TYPE_REFS, resolveAuthorizationTypeFromRegistry };
