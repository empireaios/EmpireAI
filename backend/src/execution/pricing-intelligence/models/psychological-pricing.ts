import { z } from "zod";

/** Psychological pricing tactic recommendation. */
export type PsychologicalPricing = {
  tacticId: string;
  charmPrice: number;
  anchorPrice: number;
  installmentPrice: number;
  installmentMonths: number;
  tactics: string[];
  score: number;
};

export const psychologicalPricingSchema = z.object({
  tacticId: z.string().min(1),
  charmPrice: z.number().min(0),
  anchorPrice: z.number().min(0),
  installmentPrice: z.number().min(0),
  installmentMonths: z.number().int().min(1),
  tactics: z.array(z.string().min(1)).min(1),
  score: z.number().min(0).max(100),
});

/** Validates a PsychologicalPricing record shape. */
export function validatePsychologicalPricing(value: unknown): PsychologicalPricing {
  return psychologicalPricingSchema.parse(value);
}
