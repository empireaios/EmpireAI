import { z } from "zod";

/** Competitor weakness identified from comparative review analysis. */
export type CompetitorWeakness = {
  weaknessId: string;
  competitorName: string;
  weakness: string;
  description: string;
  exploitOpportunity: string;
  score: number;
};

export const competitorWeaknessSchema = z.object({
  weaknessId: z.string().min(1),
  competitorName: z.string().min(1),
  weakness: z.string().min(1),
  description: z.string().min(1),
  exploitOpportunity: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a CompetitorWeakness record shape. */
export function validateCompetitorWeakness(value: unknown): CompetitorWeakness {
  return competitorWeaknessSchema.parse(value);
}
