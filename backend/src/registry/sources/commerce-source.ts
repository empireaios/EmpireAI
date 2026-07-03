/**
 * G2-01 — Commerce registry source adapter (EA-004 sole seed importer).
 */

import {
  COMMERCE_BRAND_SEED_ROWS,
  COMMERCE_CATEGORY_SEED_ROWS,
  COMMERCE_COUNTRY_COMMERCE_SEED_ROWS,
  COMMERCE_LOGISTICS_SEED_ROWS,
  COMMERCE_MARKETPLACE_SEED_ROWS,
  COMMERCE_PAYMENT_SEED_ROWS,
  COMMERCE_POLICY_SEED_ROWS,
  COMMERCE_PRODUCT_SOURCE_SEED_ROWS,
  COMMERCE_STOREFRONT_SEED_ROWS,
  COMMERCE_SUPPLIER_SEED_ROWS,
} from "../../orchestration/infrastructure-commerce/data/commerce-registry-seed.js";
import {
  COMMERCE_REGISTRY_IDS,
  REG_BRAND,
  REG_CATEGORY,
  REG_COMMERCE_POLICY,
  REG_COUNTRY_COMMERCE,
  REG_LOGISTICS,
  REG_MARKETPLACE,
  REG_PAYMENT,
  REG_PRODUCT_SOURCE,
  REG_STOREFRONT,
  REG_SUPPLIER,
  type CommerceRegistryId,
} from "../types/registry-ids.js";
import { COMMERCE_REGISTRY_VERSION, type CommerceRegistryRowBase } from "../types/commerce-registry-types.js";
import type { RegistryQuery } from "../types/registry-types.js";
import {
  validateCommerceRegistryBatch,
  validateCommerceRegistryRows,
} from "../validation/commerce-registry-validator.js";

export { COMMERCE_REGISTRY_VERSION };

type CommerceRegistryBatch = Record<CommerceRegistryId, CommerceRegistryRowBase[]>;

let validatedBatch: CommerceRegistryBatch | undefined;

function buildSeedBatch(): CommerceRegistryBatch {
  return {
    [REG_MARKETPLACE]: COMMERCE_MARKETPLACE_SEED_ROWS,
    [REG_SUPPLIER]: COMMERCE_SUPPLIER_SEED_ROWS,
    [REG_STOREFRONT]: COMMERCE_STOREFRONT_SEED_ROWS,
    [REG_PAYMENT]: COMMERCE_PAYMENT_SEED_ROWS,
    [REG_LOGISTICS]: COMMERCE_LOGISTICS_SEED_ROWS,
    [REG_COUNTRY_COMMERCE]: COMMERCE_COUNTRY_COMMERCE_SEED_ROWS,
    [REG_CATEGORY]: COMMERCE_CATEGORY_SEED_ROWS,
    [REG_BRAND]: COMMERCE_BRAND_SEED_ROWS,
    [REG_PRODUCT_SOURCE]: COMMERCE_PRODUCT_SOURCE_SEED_ROWS,
    [REG_COMMERCE_POLICY]: COMMERCE_POLICY_SEED_ROWS,
  };
}

export function getValidatedCommerceRegistryBatch(): CommerceRegistryBatch {
  if (!validatedBatch) {
    const batch = buildSeedBatch();
    validateCommerceRegistryBatch(batch);
    validatedBatch = batch;
  }
  return validatedBatch;
}

export function resetCommerceRegistryBatchForTests(): void {
  validatedBatch = undefined;
}

function filterRows(
  rows: CommerceRegistryRowBase[],
  query?: RegistryQuery,
): CommerceRegistryRowBase[] {
  if (query?.registryRowId) {
    return rows.filter((row) => row.id === query.registryRowId);
  }
  if (query?.countryCode) {
    return rows.filter(
      (row) =>
        row.supportedCountries.includes(query.countryCode!) ||
        row.supportedCountries.includes("*"),
    );
  }
  return rows;
}

export function loadCommerceRegistryRows(
  registryId: CommerceRegistryId,
  query?: RegistryQuery,
): CommerceRegistryRowBase[] {
  const batch = getValidatedCommerceRegistryBatch();
  const rows = batch[registryId];
  validateCommerceRegistryRows(registryId, rows);
  return filterRows(rows, query);
}

export function listCommerceRegistryCatalog(): Array<{
  registryId: CommerceRegistryId;
  rowCount: number;
  rowIds: string[];
}> {
  const batch = getValidatedCommerceRegistryBatch();
  return COMMERCE_REGISTRY_IDS.map((registryId) => ({
    registryId,
    rowCount: batch[registryId].length,
    rowIds: batch[registryId].map((row) => row.id),
  }));
}
