import { z } from "zod";

import { supplierPlatformSchema, type SupplierPlatform } from "../../supplier-connector-framework/models/supplier-platform.js";

/** Supplier-side product identity synced from a connector catalog. */
export type SupplierProduct = {
  supplierProductId: string;
  connectorId: string;
  platform: SupplierPlatform;
  supplierSku: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  productEntityId: string | null;
  canonicalSlug: string;
};

export const supplierProductSchema = z.object({
  supplierProductId: z.string().min(1),
  connectorId: z.string().min(1),
  platform: supplierPlatformSchema,
  supplierSku: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()),
  productEntityId: z.string().nullable(),
  canonicalSlug: z.string().min(1),
});

/** Validates a SupplierProduct record shape. */
export function validateSupplierProduct(value: unknown): SupplierProduct {
  return supplierProductSchema.parse(value);
}
