import { z } from "zod";

/** Optimal price recommendation derived from factor comparison. */
export type OptimalPrice = {
  priceId: string;
  recommendedPrice: number;
  compareAtPrice: number;
  priceFloor: number;
  priceCeiling: number;
  currency: string;
  marginPercent: number;
  marginDollars: number;
  supplierCost: number;
  confidence: number;
  rationale: string;
};

export const optimalPriceSchema = z.object({
  priceId: z.string().min(1),
  recommendedPrice: z.number().min(0),
  compareAtPrice: z.number().min(0),
  priceFloor: z.number().min(0),
  priceCeiling: z.number().min(0),
  currency: z.string().min(1),
  marginPercent: z.number().min(0).max(100),
  marginDollars: z.number().min(0),
  supplierCost: z.number().min(0),
  confidence: z.number().min(0).max(100),
  rationale: z.string().min(1),
});

/** Validates an OptimalPrice record shape. */
export function validateOptimalPrice(value: unknown): OptimalPrice {
  return optimalPriceSchema.parse(value);
}
