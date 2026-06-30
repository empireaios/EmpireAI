import { z } from "zod";

export const EMPIRE_HEALTH_TIERS = ["EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"] as const;

export type EmpireHealthTier = (typeof EMPIRE_HEALTH_TIERS)[number];

/** Overall Empire Health Score composite. */
export type EmpireHealthScore = {
  scoreId: string;
  overallScore: number;
  tier: EmpireHealthTier;
  healthyDimensions: number;
  warningDimensions: number;
  criticalDimensions: number;
  headline: string;
  summary: string;
};

export const empireHealthScoreSchema = z.object({
  scoreId: z.string().min(1),
  overallScore: z.number().min(0).max(100),
  tier: z.enum(EMPIRE_HEALTH_TIERS),
  healthyDimensions: z.number().int().min(0),
  warningDimensions: z.number().int().min(0),
  criticalDimensions: z.number().int().min(0),
  headline: z.string().min(1),
  summary: z.string().min(1),
});

/** Validates an EmpireHealthScore record shape. */
export function validateEmpireHealthScore(value: unknown): EmpireHealthScore {
  return empireHealthScoreSchema.parse(value);
}
