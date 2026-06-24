import { z } from "zod";

export const SUPPLIER_MATCH_SIGNAL_TYPES = [
  "supplier_trust",
  "supplier_risk",
  "category_alignment",
  "dropshipping_support",
  "branding_support",
  "fulfillment_capability",
  "opportunity_fit",
  "confidence",
] as const;

export type SupplierMatchSignalType = (typeof SUPPLIER_MATCH_SIGNAL_TYPES)[number];

/** Individual factor contributing to a supplier-opportunity match score. */
export type SupplierMatchSignal = {
  signalType: SupplierMatchSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const supplierMatchSignalSchema = z.object({
  signalType: z.enum(SUPPLIER_MATCH_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a SupplierMatchSignal record shape. */
export function validateSupplierMatchSignal(value: unknown): SupplierMatchSignal {
  return supplierMatchSignalSchema.parse(value);
}
