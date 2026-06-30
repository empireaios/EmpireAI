import { z } from "zod";

/** Bundle pricing recommendation. */
export type BundlePricing = {
  bundleId: string;
  bundleName: string;
  itemCount: number;
  individualTotal: number;
  bundlePrice: number;
  savingsPercent: number;
  savingsDollars: number;
  score: number;
};

export const bundlePricingSchema = z.object({
  bundleId: z.string().min(1),
  bundleName: z.string().min(1),
  itemCount: z.number().int().min(2),
  individualTotal: z.number().min(0),
  bundlePrice: z.number().min(0),
  savingsPercent: z.number().min(0).max(100),
  savingsDollars: z.number().min(0),
  score: z.number().min(0).max(100),
});

/** Validates a BundlePricing record shape. */
export function validateBundlePricing(value: unknown): BundlePricing {
  return bundlePricingSchema.parse(value);
}
