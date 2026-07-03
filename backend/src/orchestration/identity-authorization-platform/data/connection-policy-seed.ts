/**
 * G8-00 — Connection policy seed (REG-CONNECTION-POLICY).
 */

import {
  FOUNDATION_PROVIDER_IDS,
  IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
  type FoundationProviderId,
  type IdentityAuthorizationRegistryRowBase,
} from "../../../registry/types/identity-authorization-registry-types.js";

function connectionPolicyRow(providerId: FoundationProviderId): IdentityAuthorizationRegistryRowBase {
  return {
    id: `connection-policy-${providerId}`,
    name: `${providerId} connection policy`,
    description: `Registry-driven connection policy for ${providerId}`,
    status: "VALIDATED",
    version: "1.0.0",
    owner: "pillow:governance",
    dependencies: ["REG-READINESS-POLICY"],
    capabilities: ["connection-policy"],
    configuration: {
      connectionPolicy: {
        schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION,
        policyId: `connection-policy-${providerId}`,
        policyName: `${providerId} connection policy`,
        providerId,
        configurable: true,
        authorizationRuleRefs: [`rule:${providerId}:authorize`, `rule:${providerId}:reconnect`],
        reconnectRuleRefs: [`rule:${providerId}:reconnect`],
      },
    },
    supportedRegions: [],
    supportedCountries: [],
    validation: { schemaVersion: IDENTITY_AUTHORIZATION_REGISTRY_VERSION },
    pluginSupport: { allowPluginRegistration: true },
    workspaceScope: { scope: "global" },
    futureCompatibility: { notes: "Policy-driven — no hardcoded provider behaviour" },
  };
}

export const CONNECTION_POLICY_SEED_ROWS: IdentityAuthorizationRegistryRowBase[] =
  FOUNDATION_PROVIDER_IDS.map(connectionPolicyRow);
