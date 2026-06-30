import { z } from "zod";

import { supplierInventorySchema, type SupplierInventory } from "./supplier-inventory.js";
import { supplierPricingSchema, type SupplierPricing } from "./supplier-pricing.js";
import { supplierProductSchema, type SupplierProduct } from "./supplier-product.js";
import { supplierShippingDataSchema, type SupplierShippingData } from "./supplier-shipping-data.js";
import { supplierSyncSignalSchema, type SupplierSyncSignal } from "./supplier-sync-signal.js";

export type SupplierProductSyncRecordId = string;

/** Synced supplier product record linked to the Product Knowledge Graph. */
export type SupplierProductSyncRecord = {
  recordId: SupplierProductSyncRecordId;
  workspaceId: string;
  supplierProduct: SupplierProduct;
  supplierInventory: SupplierInventory;
  supplierPricing: SupplierPricing;
  supplierShippingData: SupplierShippingData;
  confidence: number;
  signals: SupplierSyncSignal[];
  createdAt: string;
  updatedAt: string;
};

export type SupplierProductSyncRecordCreateInput = Omit<
  SupplierProductSyncRecord,
  "recordId" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const supplierProductSyncRecordSchema = z.object({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  supplierProduct: supplierProductSchema,
  supplierInventory: supplierInventorySchema,
  supplierPricing: supplierPricingSchema,
  supplierShippingData: supplierShippingDataSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(supplierSyncSignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a SupplierProductSyncRecord record shape. */
export function validateSupplierProductSyncRecord(value: unknown): SupplierProductSyncRecord {
  return supplierProductSyncRecordSchema.parse(value);
}
