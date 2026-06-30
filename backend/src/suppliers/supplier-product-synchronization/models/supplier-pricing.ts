import { z } from "zod";

/** Pricing snapshot for a synced supplier product. */
export type SupplierPricing = {
  supplierSku: string;
  unitPrice: number;
  currency: string;
  compareAtPrice: number | null;
  marginHintPercent: number;
};

export const supplierPricingSchema = z.object({
  supplierSku: z.string().min(1),
  unitPrice: z.number().min(0),
  currency: z.string().min(3).max(3),
  compareAtPrice: z.number().min(0).nullable(),
  marginHintPercent: z.number().min(0).max(100),
});

/** Validates a SupplierPricing record shape. */
export function validateSupplierPricing(value: unknown): SupplierPricing {
  return supplierPricingSchema.parse(value);
}
