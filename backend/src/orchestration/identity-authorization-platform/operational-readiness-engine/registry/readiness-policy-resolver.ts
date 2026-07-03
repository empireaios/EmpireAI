/**
 * G8-06 — Readiness policy resolver (registry-driven).
 */

import {
  REG_AUTOMATION_WORKFLOW,
  REG_COMMERCE_POLICY,
  REG_CONNECTION_DEPENDENCY,
  REG_CONNECTION_POLICY,
  REG_IDENTITY_MONITOR,
  REG_READINESS_POLICY,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import {
  readinessPolicyConfigurationSchema,
  type ProductionWorkspaceRegistryRowBase,
} from "../../../../registry/types/production-workspace-registry-types.js";
import type { ReadinessContext } from "../contracts/readiness-types.js";
import {
  resolveAllConnectionProviders,
  resolveConnectionDependencies,
  resolveConnectionRequirements,
} from "../../connection-registry/registry/connection-registry-resolver.js";
import { resolveIdentityPlatformDependencies } from "../../registry/identity-authorization-registry-resolver.js";
import type { AutomationWorkflowRow } from "../../../../registry/types/automation-registry-types.js";
import type { CommercePolicyRow } from "../../../../registry/types/commerce-registry-types.js";

export type ReadinessPolicyProfile = {
  policyIds: string[];
  blockerConditions: string[];
  readinessSignals: string[];
  requiredProviderIds: string[];
  registryRefs: string[];
};

const OPERATION_CATEGORY_HINTS: Record<string, string[]> = {
  marketplace_operation: ["marketplace"],
  storefront_operation: ["storefront", "marketplace"],
  advertising_operation: ["advertising"],
  payment_operation: ["payment"],
  supplier_operation: ["supplier", "marketplace"],
  logistics_operation: ["supplier", "marketplace"],
  analytics_operation: ["analytics", "advertising"],
};

export function resolveReadinessPolicyProfile(context: RegistryLoaderContext = {}): ReadinessPolicyProfile {
  const loader = getRegistryLoader();
  const policyRows = loader.resolve(context, REG_READINESS_POLICY).rows as ProductionWorkspaceRegistryRowBase[];
  const policies = policyRows.map((row) =>
    readinessPolicyConfigurationSchema.parse(row.configuration.readinessPolicy),
  );
  const deps = resolveIdentityPlatformDependencies(context);
  const allProviders = resolveAllConnectionProviders(context);

  return {
    policyIds: policies.map((p) => p.policyId),
    blockerConditions: policies.flatMap((p) => p.blockerConditions),
    readinessSignals: policies.flatMap((p) => p.readinessSignals),
    requiredProviderIds: allProviders.map((p) => p.providerId),
    registryRefs: [
      "REG-READINESS-POLICY",
      "REG-CONNECTION-PROVIDER",
      "REG-CONNECTION-REQUIREMENT",
      "REG-CONNECTION-CAPABILITY",
      "REG-CONNECTION-DEPENDENCY",
      ...(deps.identityMonitors.length > 0 ? ["REG-IDENTITY-MONITOR"] : []),
      ...(loader.resolve(context, REG_AUTOMATION_WORKFLOW).rows.length > 0 ? ["REG-AUTOMATION-WORKFLOW"] : []),
      ...(loader.resolve(context, REG_COMMERCE_POLICY).rows.length > 0 ? ["REG-COMMERCE-POLICY"] : []),
      ...(loader.resolve(context, REG_CONNECTION_POLICY).rows.length > 0 ? ["REG-CONNECTION-POLICY"] : []),
    ],
  };
}

export function resolveRequiredProvidersForContext(
  readinessContext: ReadinessContext,
  context: RegistryLoaderContext = {},
): string[] {
  const allProviders = resolveAllConnectionProviders(context);
  const profile = resolveReadinessPolicyProfile(context);

  if (readinessContext === "empire_platform" || readinessContext === "workspace" || readinessContext === "company") {
    return profile.requiredProviderIds;
  }

  if (readinessContext === "account_holder" || readinessContext === "brand" || readinessContext === "business_model") {
    return resolveConnectionRequirements(context).map((r) => r.providerId);
  }

  const hints = OPERATION_CATEGORY_HINTS[readinessContext];
  if (hints) {
    return allProviders.filter((p) => hints.includes(p.providerCategory)).map((p) => p.providerId);
  }

  if (readinessContext === "workflow" || readinessContext === "automation") {
    const loader = getRegistryLoader();
    const workflows = loader.resolve(context, REG_AUTOMATION_WORKFLOW).rows as AutomationWorkflowRow[];
    if (workflows.length === 0) return profile.requiredProviderIds.slice(0, 3);
    const commercePolicies = loader.resolve(context, REG_COMMERCE_POLICY).rows as CommercePolicyRow[];
    void commercePolicies;
    return profile.requiredProviderIds.filter((id) =>
      resolveConnectionDependencies(context).some((d) => d.providerId === id),
    );
  }

  return profile.requiredProviderIds;
}

export function resolveWorkflowIds(context: RegistryLoaderContext = {}): string[] {
  const loader = getRegistryLoader();
  return (loader.resolve(context, REG_AUTOMATION_WORKFLOW).rows as AutomationWorkflowRow[]).map((row) => row.id);
}

export function resolveMonitorRefs(context: RegistryLoaderContext = {}): string[] {
  const deps = resolveIdentityPlatformDependencies(context);
  return deps.identityMonitors.map((m) => m.monitorId);
}
