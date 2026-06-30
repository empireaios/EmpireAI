import { z } from "zod";

/** Store catalog lifecycle status — no storefront publishing is executed. */
export const CATALOG_STATUSES = [
  "CATALOG_IMPORTED",
  "CATALOG_MAPPED",
  "CATALOG_PARTIAL",
  "CATALOG_FAILED",
] as const;

export type CatalogStatus = (typeof CATALOG_STATUSES)[number];

export const catalogStatusSchema = z.enum(CATALOG_STATUSES);

/** Validates a catalog status value. */
export function validateCatalogStatus(value: unknown): CatalogStatus {
  return catalogStatusSchema.parse(value);
}
