import { z } from "zod";

import { supplierShippingMethodSchema } from "./supplier-shipping-data.js";

/** Raw supplier catalog item input for synchronization. */
export type SupplierCatalogItemInput = {
  supplierSku: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  inventoryQuantity: number;
  warehouseRegion?: string;
  unitPrice: number;
  currency?: string;
  compareAtPrice?: number;
  shippingMethods?: Array<{
    method: string;
    cost: number;
    minDays: number;
    maxDays: number;
    regions: string[];
  }>;
};

export const supplierCatalogItemSchema = z.object({
  supplierSku: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  inventoryQuantity: z.number().int().min(0),
  warehouseRegion: z.string().optional(),
  unitPrice: z.number().min(0),
  currency: z.string().length(3).optional(),
  compareAtPrice: z.number().min(0).optional(),
  shippingMethods: z.array(supplierShippingMethodSchema).optional(),
});

/** Validates a SupplierCatalogItemInput record shape. */
export function validateSupplierCatalogItem(value: unknown): SupplierCatalogItemInput {
  return supplierCatalogItemSchema.parse(value);
}
