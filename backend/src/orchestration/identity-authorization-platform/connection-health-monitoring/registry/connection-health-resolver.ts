/**
 * G8-04 — Connection health registry resolver.
 */

import {
  REG_CONNECTION_POLICY,
  REG_CREDENTIAL_TYPE,
  REG_IDENTITY_MONITOR,
  REG_READINESS_POLICY,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import { identityMonitorConfigurationSchema } from "../../../../registry/types/production-workspace-registry-types.js";
import type { ProductionWorkspaceRegistryRowBase } from "../../../../registry/types/production-workspace-registry-types.js";
import type { HealthCheckType } from "../contracts/connection-health-types.js";
import { HEALTH_CHECK_TYPES } from "../contracts/connection-health-types.js";
import {
  resolveAllConnectionProviders,
  resolveConnectionProvider,
  resolveConnectionRequirements,
  resolveProviderCapabilities,
} from "../../connection-registry/registry/connection-registry-resolver.js";
import { resolveProviderCredentialRequirements } from "../../credential-vault-integration/registry/credential-vault-resolver.js";
import { resolveIdentityPlatformDependencies } from "../../registry/identity-authorization-registry-resolver.js";

export type ProviderMonitoringProfile = {
  providerId: string;
  displayName: string;
  connectionId: string;
  checkTypes: HealthCheckType[];
  monitorRefs: string[];
  requirementRefs: string[];
  capabilityRefs: string[];
  policyRefs: string[];
  credentialTypeRef: string | null;
  readinessPolicyRefs: string[];
  registryRefs: string[];
};

function resolveMonitorCheckTypes(context: RegistryLoaderContext): HealthCheckType[] {
  const loader = getRegistryLoader();
  const monitorRows = loader.resolve(context, REG_IDENTITY_MONITOR).rows as ProductionWorkspaceRegistryRowBase[];
  const checkTypes = new Set<HealthCheckType>();

  for (const row of monitorRows) {
    const monitor = identityMonitorConfigurationSchema.parse(row.configuration.identityMonitor);
    for (const ref of monitor.healthSignalRefs) {
      if (ref.includes("authorization") || ref.includes("scope")) {
        checkTypes.add("authorization_status");
        checkTypes.add("scope_completeness");
      }
      if (ref.includes("identity") || ref.includes("session")) {
        checkTypes.add("authorization_status");
      }
    }
    for (const ref of monitor.degradationRuleRefs) {
      if (ref.includes("authorization")) checkTypes.add("authorization_status");
      if (ref.includes("degradation")) checkTypes.add("readiness_status");
    }
    for (const ref of monitor.recoveryRuleRefs) {
      if (ref.includes("reconnect")) checkTypes.add("authorization_status");
    }
  }

  const defaults: HealthCheckType[] = [
    "credential_present",
    "credential_expiry",
    "authorization_status",
    "scope_completeness",
    "permission_completeness",
    "readiness_status",
    "production_status",
  ];

  for (const checkType of defaults) {
    checkTypes.add(checkType);
  }

  return Array.from(checkTypes).filter((t) => (HEALTH_CHECK_TYPES as readonly string[]).includes(t));
}

function filterCheckTypesForProvider(providerId: string, checkTypes: HealthCheckType[], context: RegistryLoaderContext) {
  const capabilities = resolveProviderCapabilities(context).filter((c) => c.providerId === providerId);
  const hasWebhook = capabilities.some((c) => c.capabilityKey.includes("webhook"));
  const hasSandbox = capabilities.some((c) => c.supportedEnvironments.includes("sandbox"));

  return checkTypes.filter((checkType) => {
    if (checkType === "webhook_status") return hasWebhook;
    if (checkType === "sandbox_status") return hasSandbox;
    return true;
  });
}

export function resolveProviderMonitoringProfile(
  providerId: string,
  context: RegistryLoaderContext = {},
): ProviderMonitoringProfile | undefined {
  const provider = resolveConnectionProvider(providerId, context);
  const requirement = resolveConnectionRequirements(context).find((r) => r.providerId === providerId);
  const credentialReq = resolveProviderCredentialRequirements(providerId, context);
  if (!provider) return undefined;

  const loader = getRegistryLoader();
  const policyCount = loader.resolve(context, REG_CONNECTION_POLICY).rows.length;
  const credentialCount = loader.resolve(context, REG_CREDENTIAL_TYPE).rows.length;
  const deps = resolveIdentityPlatformDependencies(context);
  const baseCheckTypes = resolveMonitorCheckTypes(context);
  const checkTypes = filterCheckTypesForProvider(providerId, baseCheckTypes, context);

  const capabilities = resolveProviderCapabilities(context).filter((c) => c.providerId === providerId);

  return {
    providerId,
    displayName: provider.providerName ?? providerId,
    connectionId: `conn:${providerId}`,
    checkTypes,
    monitorRefs: deps.identityMonitors.map((m) => m.monitorId),
    requirementRefs: requirement ? [requirement.requirementId] : [],
    capabilityRefs: capabilities.map((c) => c.capabilityId),
    policyRefs: [`REG-CONNECTION-POLICY:${policyCount}`],
    credentialTypeRef: credentialReq?.credentialTypeId ?? null,
    readinessPolicyRefs: deps.readinessPolicies.map((p) => p.policyId),
    registryRefs: [
      "REG-IDENTITY-MONITOR",
      "REG-CONNECTION-PROVIDER",
      "REG-CONNECTION-REQUIREMENT",
      "REG-CONNECTION-CAPABILITY",
      "REG-CONNECTION-POLICY",
      ...(credentialCount > 0 ? ["REG-CREDENTIAL-TYPE"] : []),
      ...(deps.readinessPolicies.length > 0 ? ["REG-READINESS-POLICY"] : []),
    ],
  };
}

export function resolveAllProviderMonitoringProfiles(context: RegistryLoaderContext = {}) {
  return resolveAllConnectionProviders(context)
    .map((p) => resolveProviderMonitoringProfile(p.providerId, context))
    .filter((entry): entry is ProviderMonitoringProfile => entry !== undefined);
}
