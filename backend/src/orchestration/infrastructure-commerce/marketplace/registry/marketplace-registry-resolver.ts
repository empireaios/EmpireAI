/**
 * G2-02 — Marketplace registry resolver (REG-MARKETPLACE, REG-COMMERCE-POLICY, REG-COUNTRY-COMMERCE).
 */

import type { CommerceCountryCommerceRow, CommerceMarketplaceRow, CommercePolicyRow } from "../../../../registry/types/commerce-registry-types.js";
import {
  REG_COMMERCE_POLICY,
  REG_COUNTRY_COMMERCE,
  REG_MARKETPLACE,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import { resolveCommerceRegistry } from "../../registry/commerce-registry-resolver.js";

export type MarketplaceRegistrySnapshot = {
  marketplaces: CommerceMarketplaceRow[];
  policies: CommercePolicyRow[];
  countryCommerce: CommerceCountryCommerceRow[];
  resolvedAt: string;
  registrySource: "RegistryLoader:REG-MARKETPLACE|REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE";
};

export function resolveMarketplaceRegistrySnapshot(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): MarketplaceRegistrySnapshot {
  const marketplaces = resolveCommerceRegistry<CommerceMarketplaceRow>(
    context,
    REG_MARKETPLACE,
    query,
  ).rows;
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY).rows;
  const countryCommerce = resolveCommerceRegistry<CommerceCountryCommerceRow>(
    context,
    REG_COUNTRY_COMMERCE,
  ).rows;

  return {
    marketplaces,
    policies,
    countryCommerce,
    resolvedAt: new Date().toISOString(),
    registrySource: "RegistryLoader:REG-MARKETPLACE|REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE",
  };
}

export function resolveMarketplaceRowById(
  context: RegistryLoaderContext,
  marketplaceId: string,
): CommerceMarketplaceRow | undefined {
  const result = resolveCommerceRegistry<CommerceMarketplaceRow>(context, REG_MARKETPLACE, {
    registryRowId: marketplaceId,
  });
  return result.rows[0];
}

export function resolvePolicyForMarketplace(
  context: RegistryLoaderContext,
  marketplace: CommerceMarketplaceRow,
): CommercePolicyRow | undefined {
  if (!marketplace.policyRef) {
    return undefined;
  }
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY, {
    registryRowId: marketplace.policyRef,
  }).rows;
  return policies[0];
}

export function resolveCountryCommerceForMarketplace(
  context: RegistryLoaderContext,
  marketplace: CommerceMarketplaceRow,
): CommerceCountryCommerceRow[] {
  const snapshot = resolveCommerceRegistry<CommerceCountryCommerceRow>(
    context,
    REG_COUNTRY_COMMERCE,
  ).rows;
  return snapshot.filter(
    (row) =>
      marketplace.supportedCountries.includes(row.countryCode) ||
      marketplace.supportedCountries.includes("*") ||
      row.supportedCountries.includes("*"),
  );
}
