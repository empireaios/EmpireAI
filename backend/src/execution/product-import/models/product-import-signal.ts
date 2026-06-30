import { z } from "zod";

export const PRODUCT_IMPORT_SIGNAL_TYPES = [
  "supplier_alignment",
  "import_coverage",
  "mapping_coverage",
  "pricing_markup",
  "inventory_readiness",
  "catalog_composite",
] as const;

export type ProductImportSignalType = (typeof PRODUCT_IMPORT_SIGNAL_TYPES)[number];

/** Individual factor contributing to product import scoring. */
export type ProductImportSignal = {
  signalType: ProductImportSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const productImportSignalSchema = z.object({
  signalType: z.enum(PRODUCT_IMPORT_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a ProductImportSignal record shape. */
export function validateProductImportSignal(value: unknown): ProductImportSignal {
  return productImportSignalSchema.parse(value);
}
