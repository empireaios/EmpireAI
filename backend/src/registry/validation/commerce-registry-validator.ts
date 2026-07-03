/**
 * G2-01 — Commerce registry validation (schema, duplicates, dependency chains).
 * Pillow governs registries; Infrastructure & Commerce consumes via RegistryLoader only.
 */

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
import {
  commerceBrandRowSchema,
  commerceCategoryRowSchema,
  commerceCountryCommerceRowSchema,
  commerceLogisticsRowSchema,
  commerceMarketplaceRowSchema,
  commercePaymentRowSchema,
  commercePolicyRowSchema,
  commerceProductSourceRowSchema,
  commerceStorefrontRowSchema,
  commerceSupplierRowSchema,
  type CommerceRegistryRowBase,
} from "../types/commerce-registry-types.js";
import { RegistryValidationError } from "./registry-validator.js";

export class CommerceRegistryValidationError extends RegistryValidationError {
  constructor(message: string) {
    super(message);
    this.name = "CommerceRegistryValidationError";
  }
}

type CommerceRegistryBatch = Record<CommerceRegistryId, CommerceRegistryRowBase[]>;

const SCHEMA_BY_REGISTRY: Record<
  CommerceRegistryId,
  { parse: (row: unknown) => CommerceRegistryRowBase }
> = {
  [REG_MARKETPLACE]: { parse: (row) => commerceMarketplaceRowSchema.parse(row) },
  [REG_SUPPLIER]: { parse: (row) => commerceSupplierRowSchema.parse(row) },
  [REG_STOREFRONT]: { parse: (row) => commerceStorefrontRowSchema.parse(row) },
  [REG_PAYMENT]: { parse: (row) => commercePaymentRowSchema.parse(row) },
  [REG_LOGISTICS]: { parse: (row) => commerceLogisticsRowSchema.parse(row) },
  [REG_COUNTRY_COMMERCE]: { parse: (row) => commerceCountryCommerceRowSchema.parse(row) },
  [REG_CATEGORY]: { parse: (row) => commerceCategoryRowSchema.parse(row) },
  [REG_BRAND]: { parse: (row) => commerceBrandRowSchema.parse(row) },
  [REG_PRODUCT_SOURCE]: { parse: (row) => commerceProductSourceRowSchema.parse(row) },
  [REG_COMMERCE_POLICY]: { parse: (row) => commercePolicyRowSchema.parse(row) },
};

export function parseCommerceRegistryRow(
  registryId: CommerceRegistryId,
  row: unknown,
): CommerceRegistryRowBase {
  try {
    return SCHEMA_BY_REGISTRY[registryId].parse(row);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new CommerceRegistryValidationError(`Malformed ${registryId} row: ${detail}`);
  }
}

export function validateCommerceRegistryRows(
  registryId: CommerceRegistryId,
  rows: unknown[],
): CommerceRegistryRowBase[] {
  const parsed = rows.map((row, index) => {
    try {
      return parseCommerceRegistryRow(registryId, row);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new CommerceRegistryValidationError(`${registryId} row ${index}: ${detail}`);
    }
  });

  assertUniqueRowIds(registryId, parsed);
  return parsed;
}

export function assertUniqueRowIds(
  registryId: CommerceRegistryId,
  rows: CommerceRegistryRowBase[],
): void {
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) {
      throw new CommerceRegistryValidationError(`Duplicate ${registryId} row id: ${row.id}`);
    }
    seen.add(row.id);
  }
}

function buildGlobalIdIndex(batch: CommerceRegistryBatch): Map<string, CommerceRegistryId> {
  const index = new Map<string, CommerceRegistryId>();
  for (const registryId of COMMERCE_REGISTRY_IDS) {
    for (const row of batch[registryId]) {
      if (index.has(row.id)) {
        throw new CommerceRegistryValidationError(
          `Duplicate commerce registry id across registries: ${row.id}`,
        );
      }
      index.set(row.id, registryId);
    }
  }
  return index;
}

function assertDependencyExists(
  sourceRegistryId: CommerceRegistryId,
  rowId: string,
  dependencyId: string,
  index: Map<string, CommerceRegistryId>,
): void {
  if (!index.has(dependencyId)) {
    throw new CommerceRegistryValidationError(
      `${sourceRegistryId} row ${rowId} depends on unknown id: ${dependencyId}`,
    );
  }
}

function assertVersionCompatibility(row: CommerceRegistryRowBase): void {
  if (row.validation.schemaVersion !== row.futureCompatibility.minSchemaVersion) {
    throw new CommerceRegistryValidationError(
      `Row ${row.id} validation.schemaVersion must match futureCompatibility.minSchemaVersion`,
    );
  }
}

export function validateCommerceRegistryBatch(batch: CommerceRegistryBatch): void {
  for (const registryId of COMMERCE_REGISTRY_IDS) {
    validateCommerceRegistryRows(registryId, batch[registryId]);
  }

  const index = buildGlobalIdIndex(batch);

  for (const registryId of COMMERCE_REGISTRY_IDS) {
    for (const row of batch[registryId]) {
      assertVersionCompatibility(row);
      for (const dependencyId of row.dependencies) {
        assertDependencyExists(registryId, row.id, dependencyId, index);
      }
    }
  }
}
