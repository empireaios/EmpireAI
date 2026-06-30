import { z } from "zod";

import { pricingFactorTypeSchema, type PricingFactorType } from "./pricing-factor-types.js";

/** Comparative analysis for a single pricing factor. */
export type PricingFactorAnalysis = {
  analysisId: string;
  factorType: PricingFactorType;
  displayName: string;
  score: number;
  benchmarkScore: number;
  currentValue: number;
  recommendedValue: number;
  unit: string;
  findings: string[];
  recommendation: string;
};

export const pricingFactorAnalysisSchema = z.object({
  analysisId: z.string().min(1),
  factorType: pricingFactorTypeSchema,
  displayName: z.string().min(1),
  score: z.number().min(0).max(100),
  benchmarkScore: z.number().min(0).max(100),
  currentValue: z.number(),
  recommendedValue: z.number(),
  unit: z.string().min(1),
  findings: z.array(z.string().min(1)).min(1),
  recommendation: z.string().min(1),
});

/** Validates a PricingFactorAnalysis record shape. */
export function validatePricingFactorAnalysis(value: unknown): PricingFactorAnalysis {
  return pricingFactorAnalysisSchema.parse(value);
}
