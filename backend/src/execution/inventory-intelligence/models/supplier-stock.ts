import { z } from "zod";

export const SUPPLIER_STOCK_STATUSES = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "DISCONTINUED"] as const;

export type SupplierStockStatus = (typeof SUPPLIER_STOCK_STATUSES)[number];

/** Supplier stock level tracking. */
export type SupplierStock = {
  stockId: string;
  supplierName: string;
  sku: string;
  availableUnits: number;
  reservedUnits: number;
  status: SupplierStockStatus;
  lastSyncedAt: string;
  score: number;
};

export const supplierStockSchema = z.object({
  stockId: z.string().min(1),
  supplierName: z.string().min(1),
  sku: z.string().min(1),
  availableUnits: z.number().int().min(0),
  reservedUnits: z.number().int().min(0),
  status: z.enum(SUPPLIER_STOCK_STATUSES),
  lastSyncedAt: z.string().datetime({ offset: true }),
  score: z.number().min(0).max(100),
});

/** Validates a SupplierStock record shape. */
export function validateSupplierStock(value: unknown): SupplierStock {
  return supplierStockSchema.parse(value);
}
