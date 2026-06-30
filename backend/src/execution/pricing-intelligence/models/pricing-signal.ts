import { z } from "zod";

export const PRICING_SIGNAL_TYPES = [
  "cost_competitiveness",
  "competitive_position",
  "margin_health",
  "demand_alignment",
  "elasticity_balance",
  "psychological_fit",
  "bundle_opportunity",
  "discount_safety",
  "pricing_composite",
] as const;

export type PricingSignalType = (typeof PRICING_SIGNAL_TYPES)[number];

/** Scoring signal for pricing intelligence confidence. */
export type PricingSignal = {
  signalType: PricingSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const pricingSignalSchema = z.object({
  signalType: z.enum(PRICING_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a PricingSignal record shape. */
export function validatePricingSignal(value: unknown): PricingSignal {
  return pricingSignalSchema.parse(value);
}
