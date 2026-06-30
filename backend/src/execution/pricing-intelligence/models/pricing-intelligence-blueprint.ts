import { z } from "zod";

import { bundlePricingSchema, type BundlePricing } from "./bundle-pricing.js";
import { discountStrategySchema, type DiscountStrategy } from "./discount-strategy.js";
import { optimalPriceSchema, type OptimalPrice } from "./optimal-price.js";
import {
  pricingFactorAnalysisSchema,
  type PricingFactorAnalysis,
} from "./pricing-factor-analysis.js";
import { pricingSignalSchema, type PricingSignal } from "./pricing-signal.js";
import {
  psychologicalPricingSchema,
  type PsychologicalPricing,
} from "./psychological-pricing.js";

export type PricingIntelligenceBlueprintId = string;

/** Complete optimal pricing blueprint — intelligence only, no auto-apply. */
export type PricingIntelligenceBlueprint = {
  blueprintId: PricingIntelligenceBlueprintId;
  storeId: string;
  brandId: string;
  blueprintName: string;
  optimalPrice: OptimalPrice;
  factorAnalyses: PricingFactorAnalysis[];
  psychologicalPricing: PsychologicalPricing;
  bundles: BundlePricing[];
  discountStrategy: DiscountStrategy;
  overallScore: number;
  confidence: number;
  signals: PricingSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoApplyEnabled: false;
};

export type PricingIntelligenceBlueprintCreateInput = Omit<
  PricingIntelligenceBlueprint,
  "blueprintId"
>;

export const pricingIntelligenceBlueprintSchema = z.object({
  blueprintId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  blueprintName: z.string().min(1),
  optimalPrice: optimalPriceSchema,
  factorAnalyses: z.array(pricingFactorAnalysisSchema).length(8),
  psychologicalPricing: psychologicalPricingSchema,
  bundles: z.array(bundlePricingSchema).min(1),
  discountStrategy: discountStrategySchema,
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(pricingSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoApplyEnabled: z.literal(false),
});

/** Validates a PricingIntelligenceBlueprint record shape. */
export function validatePricingIntelligenceBlueprint(
  value: unknown,
): PricingIntelligenceBlueprint {
  return pricingIntelligenceBlueprintSchema.parse(value);
}
