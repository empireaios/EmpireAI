/**
 * G2-03 — Supplier registry resolver (REG-SUPPLIER, REG-PRODUCT-SOURCE, REG-COMMERCE-POLICY, REG-COUNTRY-COMMERCE).
 */

import type {
  CommerceCountryCommerceRow,
  CommercePolicyRow,
  CommerceProductSourceRow,
  CommerceSupplierRow,
} from "../../../../registry/types/commerce-registry-types.js";
import {
  REG_COMMERCE_POLICY,
  REG_COUNTRY_COMMERCE,
  REG_PRODUCT_SOURCE,
  REG_SUPPLIER,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import { resolveCommerceRegistry } from "../../registry/commerce-registry-resolver.js";

export type SupplierRegistrySnapshot = {
  suppliers: CommerceSupplierRow[];
  productSources: CommerceProductSourceRow[];
  policies: CommercePolicyRow[];
  countryCommerce: CommerceCountryCommerceRow[];
  resolvedAt: string;
  registrySource: "RegistryLoader:REG-SUPPLIER|REG-PRODUCT-SOURCE|REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE";
};

export function resolveSupplierRegistrySnapshot(
  context: RegistryLoaderContext = {},
  query?: RegistryQuery,
): SupplierRegistrySnapshot {
  const suppliers = resolveCommerceRegistry<CommerceSupplierRow>(context, REG_SUPPLIER, query).rows;
  const productSources = resolveCommerceRegistry<CommerceProductSourceRow>(
    context,
    REG_PRODUCT_SOURCE,
  ).rows;
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY).rows;
  const countryCommerce = resolveCommerceRegistry<CommerceCountryCommerceRow>(
    context,
    REG_COUNTRY_COMMERCE,
  ).rows;

  return {
    suppliers,
    productSources,
    policies,
    countryCommerce,
    resolvedAt: new Date().toISOString(),
    registrySource:
      "RegistryLoader:REG-SUPPLIER|REG-PRODUCT-SOURCE|REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE",
  };
}

export function resolveSupplierRowById(
  context: RegistryLoaderContext,
  supplierId: string,
): CommerceSupplierRow | undefined {
  const result = resolveCommerceRegistry<CommerceSupplierRow>(context, REG_SUPPLIER, {
    registryRowId: supplierId,
  });
  return result.rows[0];
}

export function resolvePolicyForSupplier(
  context: RegistryLoaderContext,
  supplier: CommerceSupplierRow,
): CommercePolicyRow | undefined {
  if (!supplier.policyRef) {
    return undefined;
  }
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY, {
    registryRowId: supplier.policyRef,
  }).rows;
  return policies[0];
}

export function resolveProductSourcesForSupplier(
  context: RegistryLoaderContext,
  supplierId: string,
): CommerceProductSourceRow[] {
  const productSources = resolveCommerceRegistry<CommerceProductSourceRow>(
    context,
    REG_PRODUCT_SOURCE,
  ).rows;
  return productSources.filter(
    (row) => row.dependencies.includes(supplierId) || row.channelRef === supplierId,
  );
}

export function resolveCountryCommerceForSupplier(
  context: RegistryLoaderContext,
  supplier: CommerceSupplierRow,
): CommerceCountryCommerceRow[] {
  const rows = resolveCommerceRegistry<CommerceCountryCommerceRow>(
    context,
    REG_COUNTRY_COMMERCE,
  ).rows;
  return rows.filter(
    (row) =>
      supplier.supportedCountries.includes(row.countryCode) ||
      supplier.supportedCountries.includes("*") ||
      row.supportedCountries.includes("*"),
  );
}
