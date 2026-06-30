import { z } from "zod";

export const SUPPLIER_SYNC_SIGNAL_TYPES = [
  "catalog_alignment",
  "inventory_freshness",
  "pricing_validity",
  "shipping_coverage",
  "knowledge_graph_mapping",
  "sync_composite",
] as const;

export type SupplierSyncSignalType = (typeof SUPPLIER_SYNC_SIGNAL_TYPES)[number];

/** Individual factor contributing to supplier product sync scoring. */
export type SupplierSyncSignal = {
  signalType: SupplierSyncSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const supplierSyncSignalSchema = z.object({
  signalType: z.enum(SUPPLIER_SYNC_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a SupplierSyncSignal record shape. */
export function validateSupplierSyncSignal(value: unknown): SupplierSyncSignal {
  return supplierSyncSignalSchema.parse(value);
}
