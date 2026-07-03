/**
 * G2-07 — Analytics registry resolver (REG-COMMERCE-POLICY, REG-COUNTRY-COMMERCE).
 */

import type {
  CommerceCountryCommerceRow,
  CommercePolicyRow,
} from "../../../../registry/types/commerce-registry-types.js";
import {
  REG_COMMERCE_POLICY,
  REG_COUNTRY_COMMERCE,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import { resolveCommerceRegistry } from "../../registry/commerce-registry-resolver.js";
import type { AnalyticsProviderRow } from "../contracts/analytics-integration-types.js";
import {
  getAnalyticsProviderRowById,
  listAnalyticsProviderRows,
} from "../data/analytics-provider-store.js";

export type AnalyticsRegistrySnapshot = {
  providers: AnalyticsProviderRow[];
  policies: CommercePolicyRow[];
  countryCommerce: CommerceCountryCommerceRow[];
  resolvedAt: string;
  registrySource: "REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE|AnalyticsProviderCatalog:dynamic";
};

export function resolveAnalyticsRegistrySnapshot(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): AnalyticsRegistrySnapshot {
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY).rows;
  const countryCommerce = resolveCommerceRegistry<CommerceCountryCommerceRow>(
    context,
    REG_COUNTRY_COMMERCE,
  ).rows;

  let providers = listAnalyticsProviderRows();
  if (query?.registryRowId) {
    const row = getAnalyticsProviderRowById(query.registryRowId);
    providers = row ? [row] : [];
  }

  return {
    providers,
    policies,
    countryCommerce,
    resolvedAt: new Date().toISOString(),
    registrySource: "REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE|AnalyticsProviderCatalog:dynamic",
  };
}

export function resolvePolicyForAnalytics(
  context: RegistryLoaderContext,
  provider: AnalyticsProviderRow,
): CommercePolicyRow | undefined {
  if (!provider.policyRef) {
    return undefined;
  }
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY, {
    registryRowId: provider.policyRef,
  }).rows;
  return policies[0];
}

export function resolveRetentionPolicyForAnalytics(
  context: RegistryLoaderContext,
  provider: AnalyticsProviderRow,
): { retentionDays: number; policyRef?: string } {
  const policy = resolvePolicyForAnalytics(context, provider);
  const integration = provider.configuration.integrationFramework as
    | { retentionPolicy?: { retentionDays?: number; policyRef?: string } }
    | undefined;
  return {
    retentionDays: integration?.retentionPolicy?.retentionDays ?? 90,
    policyRef: integration?.retentionPolicy?.policyRef ?? policy?.id,
  };
}
