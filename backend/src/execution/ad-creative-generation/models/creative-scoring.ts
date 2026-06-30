import { z } from "zod";

/** Creative quality scoring for ad blueprints. */
export type CreativeScoring = {
  scrollStoppingScore: number;
  emotionalScore: number;
  clarityScore: number;
  conversionScore: number;
  confidence: number;
};

export const creativeScoringSchema = z.object({
  scrollStoppingScore: z.number().min(0).max(100),
  emotionalScore: z.number().min(0).max(100),
  clarityScore: z.number().min(0).max(100),
  conversionScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
});

/** Validates a CreativeScoring record shape. */
export function validateCreativeScoring(value: unknown): CreativeScoring {
  return creativeScoringSchema.parse(value);
}
