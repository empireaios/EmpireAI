/**
 * G2-06 — Logistics registry resolver (REG-LOGISTICS, REG-COUNTRY-COMMERCE, REG-COMMERCE-POLICY).
 */

import type {
  CommerceCountryCommerceRow,
  CommerceLogisticsRow,
  CommercePolicyRow,
} from "../../../../registry/types/commerce-registry-types.js";
import {
  REG_COMMERCE_POLICY,
  REG_COUNTRY_COMMERCE,
  REG_LOGISTICS,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import { resolveCommerceRegistry } from "../../registry/commerce-registry-resolver.js";

export type LogisticsRegistrySnapshot = {
  logistics: CommerceLogisticsRow[];
  policies: CommercePolicyRow[];
  countryCommerce: CommerceCountryCommerceRow[];
  resolvedAt: string;
  registrySource: "RegistryLoader:REG-LOGISTICS|REG-COUNTRY-COMMERCE|REG-COMMERCE-POLICY";
};

export function resolveLogisticsRegistrySnapshot(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): LogisticsRegistrySnapshot {
  const logistics = resolveCommerceRegistry<CommerceLogisticsRow>(context, REG_LOGISTICS, query).rows;
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY).rows;
  const countryCommerce = resolveCommerceRegistry<CommerceCountryCommerceRow>(
    context,
    REG_COUNTRY_COMMERCE,
  ).rows;

  return {
    logistics,
    policies,
    countryCommerce,
    resolvedAt: new Date().toISOString(),
    registrySource: "RegistryLoader:REG-LOGISTICS|REG-COUNTRY-COMMERCE|REG-COMMERCE-POLICY",
  };
}

export function resolveLogisticsRowById(
  context: RegistryLoaderContext,
  providerId: string,
): CommerceLogisticsRow | undefined {
  const result = resolveCommerceRegistry<CommerceLogisticsRow>(context, REG_LOGISTICS, {
    registryRowId: providerId,
  });
  return result.rows[0];
}

export function resolvePolicyForLogistics(
  context: RegistryLoaderContext,
  logistics: CommerceLogisticsRow,
): CommercePolicyRow | undefined {
  if (!logistics.policyRef) {
    return undefined;
  }
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY, {
    registryRowId: logistics.policyRef,
  }).rows;
  return policies[0];
}

export function resolveRegionsForLogistics(
  context: RegistryLoaderContext,
  logistics: CommerceLogisticsRow,
): string[] {
  const countries = resolveCommerceRegistry<CommerceCountryCommerceRow>(
    context,
    REG_COUNTRY_COMMERCE,
  ).rows;
  const matched = countries.filter(
    (row) =>
      logistics.supportedCountries.includes(row.countryCode) ||
      logistics.supportedCountries.includes("*") ||
      row.supportedCountries.includes("*"),
  );
  const regions = new Set<string>(logistics.supportedRegions);
  for (const row of matched) {
    for (const region of row.supportedRegions) {
      regions.add(region);
    }
  }
  return [...regions];
}
