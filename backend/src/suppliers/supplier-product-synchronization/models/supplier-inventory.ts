import { z } from "zod";

/** Inventory snapshot for a synced supplier product. */
export type SupplierInventory = {
  supplierSku: string;
  quantity: number;
  warehouseRegion: string;
  inStock: boolean;
  syncMode: "STUB" | "SANDBOX" | "LIVE";
  lastUpdatedAt: string;
};

export const supplierInventorySchema = z.object({
  supplierSku: z.string().min(1),
  quantity: z.number().int().min(0),
  warehouseRegion: z.string().min(1),
  inStock: z.boolean(),
  syncMode: z.enum(["STUB", "SANDBOX", "LIVE"]),
  lastUpdatedAt: z.string().datetime({ offset: true }),
});

/** Validates a SupplierInventory record shape. */
export function validateSupplierInventory(value: unknown): SupplierInventory {
  return supplierInventorySchema.parse(value);
}
