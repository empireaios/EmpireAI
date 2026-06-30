import { z } from "zod";

export const SUPPLIER_PLATFORMS = [
  "CJ_DROPSHIPPING",
  "ALIEXPRESS",
  "ZENDROP",
  "AUTODS",
] as const;

export type SupplierPlatform = (typeof SUPPLIER_PLATFORMS)[number];

export const supplierPlatformSchema = z.enum(SUPPLIER_PLATFORMS);

/** Validates a supplier platform value. */
export function validateSupplierPlatform(value: unknown): SupplierPlatform {
  return supplierPlatformSchema.parse(value);
}

/** Normalizes a supplier platform slug to the canonical enum value. */
export function normalizeSupplierPlatform(value: string): SupplierPlatform | null {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  const aliases: Record<string, SupplierPlatform> = {
    CJ_DROPSHIPPING: "CJ_DROPSHIPPING",
    CJ: "CJ_DROPSHIPPING",
    ALIEXPRESS: "ALIEXPRESS",
    ALI_EXPRESS: "ALIEXPRESS",
    ZENDROP: "ZENDROP",
    AUTODS: "AUTODS",
    AUTO_DS: "AUTODS",
  };

  return aliases[normalized] ?? null;
}
