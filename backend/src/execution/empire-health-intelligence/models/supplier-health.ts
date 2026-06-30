import { z } from "zod";

export const SUPPLIER_HEALTH_STATUSES = ["HEALTHY", "WARNING", "CRITICAL"] as const;

export type SupplierHealthStatus = (typeof SUPPLIER_HEALTH_STATUSES)[number];

/** Supplier health monitor snapshot. */
export type SupplierHealth = {
  monitorId: string;
  activeSuppliers: number;
  fulfillmentRatePercent: number;
  averageLeadTimeDays: number;
  stockoutIncidents: number;
  primarySupplier: string;
  status: SupplierHealthStatus;
  score: number;
  summary: string;
};

export const supplierHealthSchema = z.object({
  monitorId: z.string().min(1),
  activeSuppliers: z.number().int().min(0),
  fulfillmentRatePercent: z.number().min(0).max(100),
  averageLeadTimeDays: z.number().min(0),
  stockoutIncidents: z.number().int().min(0),
  primarySupplier: z.string().min(1),
  status: z.enum(SUPPLIER_HEALTH_STATUSES),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a SupplierHealth record shape. */
export function validateSupplierHealth(value: unknown): SupplierHealth {
  return supplierHealthSchema.parse(value);
}
