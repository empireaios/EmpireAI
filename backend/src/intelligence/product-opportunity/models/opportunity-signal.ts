import { z } from "zod";

export const OPPORTUNITY_SIGNAL_TYPES = [
  "buyer_demand",
  "buyer_product_match",
  "reachability",
  "competition",
  "content_difficulty",
  "supplier_availability",
  "confidence",
] as const;

export type OpportunitySignalType = (typeof OPPORTUNITY_SIGNAL_TYPES)[number];

/** Individual factor contributing to a product opportunity score. */
export type OpportunitySignal = {
  signalType: OpportunitySignalType;
  score: number;
  weight: number;
  detail: string;
};

export const opportunitySignalSchema = z.object({
  signalType: z.enum(OPPORTUNITY_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an OpportunitySignal record shape. */
export function validateOpportunitySignal(value: unknown): OpportunitySignal {
  return opportunitySignalSchema.parse(value);
}
