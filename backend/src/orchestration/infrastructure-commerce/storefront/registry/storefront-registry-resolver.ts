/**
 * G2-04 — Storefront registry resolver (REG-STOREFRONT, REG-BRAND, REG-CATEGORY, REG-COMMERCE-POLICY).
 */

import type {
  CommerceBrandRow,
  CommerceCategoryRow,
  CommercePolicyRow,
  CommerceStorefrontRow,
} from "../../../../registry/types/commerce-registry-types.js";
import {
  REG_BRAND,
  REG_CATEGORY,
  REG_COMMERCE_POLICY,
  REG_STOREFRONT,
} from "../../../../registry/types/registry-ids.js";
import type { RegistryLoaderContext, RegistryQuery } from "../../../../registry/types/registry-types.js";
import { resolveCommerceRegistry } from "../../registry/commerce-registry-resolver.js";

export type StorefrontRegistrySnapshot = {
  storefronts: CommerceStorefrontRow[];
  brands: CommerceBrandRow[];
  categories: CommerceCategoryRow[];
  policies: CommercePolicyRow[];
  resolvedAt: string;
  registrySource: "RegistryLoader:REG-STOREFRONT|REG-BRAND|REG-CATEGORY|REG-COMMERCE-POLICY";
};

export function resolveStorefrontRegistrySnapshot(
  context: RegistryLoaderContext,
  query?: RegistryQuery,
): StorefrontRegistrySnapshot {
  const storefronts = resolveCommerceRegistry<CommerceStorefrontRow>(
    context,
    REG_STOREFRONT,
    query,
  ).rows;
  const brands = resolveCommerceRegistry<CommerceBrandRow>(context, REG_BRAND).rows;
  const categories = resolveCommerceRegistry<CommerceCategoryRow>(context, REG_CATEGORY).rows;
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY).rows;

  return {
    storefronts,
    brands,
    categories,
    policies,
    resolvedAt: new Date().toISOString(),
    registrySource: "RegistryLoader:REG-STOREFRONT|REG-BRAND|REG-CATEGORY|REG-COMMERCE-POLICY",
  };
}

export function resolveStorefrontRowById(
  context: RegistryLoaderContext,
  storefrontId: string,
): CommerceStorefrontRow | undefined {
  const result = resolveCommerceRegistry<CommerceStorefrontRow>(context, REG_STOREFRONT, {
    registryRowId: storefrontId,
  });
  return result.rows[0];
}

export function resolvePolicyForStorefront(
  context: RegistryLoaderContext,
  storefront: CommerceStorefrontRow,
): CommercePolicyRow | undefined {
  if (!storefront.policyRef) {
    return undefined;
  }
  const policies = resolveCommerceRegistry<CommercePolicyRow>(context, REG_COMMERCE_POLICY, {
    registryRowId: storefront.policyRef,
  }).rows;
  return policies[0];
}

export function resolveBrandForStorefront(
  context: RegistryLoaderContext,
  brandRef?: string,
): CommerceBrandRow | undefined {
  if (!brandRef) {
    return undefined;
  }
  const brands = resolveCommerceRegistry<CommerceBrandRow>(context, REG_BRAND, {
    registryRowId: brandRef,
  }).rows;
  return brands[0];
}

export function resolveCategoryForStorefront(
  context: RegistryLoaderContext,
  categoryRef?: string,
): CommerceCategoryRow | undefined {
  if (!categoryRef) {
    return undefined;
  }
  const categories = resolveCommerceRegistry<CommerceCategoryRow>(context, REG_CATEGORY, {
    registryRowId: categoryRef,
  }).rows;
  return categories[0];
}
