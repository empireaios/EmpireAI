import { z } from "zod";

export const BRAND_PRODUCT_SIGNAL_TYPES = [
  "hero_fit",
  "supporting_fit",
  "bundle_fit",
  "opportunity_score",
  "supplier_match",
  "relationship_strength",
  "entity_confidence",
  "portfolio_composite",
] as const;

export type BrandProductSignalType = (typeof BRAND_PRODUCT_SIGNAL_TYPES)[number];

/** Individual factor contributing to brand product portfolio scoring. */
export type BrandProductSignal = {
  signalType: BrandProductSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const brandProductSignalSchema = z.object({
  signalType: z.enum(BRAND_PRODUCT_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a BrandProductSignal record shape. */
export function validateBrandProductSignal(value: unknown): BrandProductSignal {
  return brandProductSignalSchema.parse(value);
}
