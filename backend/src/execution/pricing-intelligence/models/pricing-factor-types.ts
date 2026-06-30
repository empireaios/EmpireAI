import { z } from "zod";

export const PRICING_FACTOR_TYPES = [
  "SUPPLIER_COST",
  "COMPETITION",
  "MARGIN",
  "DEMAND",
  "ELASTICITY",
  "PSYCHOLOGICAL_PRICING",
  "BUNDLES",
  "DISCOUNT_STRATEGY",
] as const;

export type PricingFactorType = (typeof PRICING_FACTOR_TYPES)[number];

export const PRICING_FACTOR_LABELS: Record<PricingFactorType, string> = {
  SUPPLIER_COST: "Supplier Cost",
  COMPETITION: "Competition",
  MARGIN: "Margin",
  DEMAND: "Demand",
  ELASTICITY: "Elasticity",
  PSYCHOLOGICAL_PRICING: "Psychological Pricing",
  BUNDLES: "Bundles",
  DISCOUNT_STRATEGY: "Discount Strategy",
};

export const pricingFactorTypeSchema = z.enum(PRICING_FACTOR_TYPES);

/** Validates a PricingFactorType value. */
export function validatePricingFactorType(value: unknown): PricingFactorType {
  return pricingFactorTypeSchema.parse(value);
}
