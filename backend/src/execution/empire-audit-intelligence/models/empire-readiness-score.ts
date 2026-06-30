import { z } from "zod";

export const READINESS_TIERS = [
  "LAUNCH_READY",
  "NEAR_READY",
  "DEVELOPING",
  "EARLY_STAGE",
  "NOT_READY",
] as const;

export type ReadinessTier = (typeof READINESS_TIERS)[number];

/** Empire Readiness Score composite from full audit. */
export type EmpireReadinessScore = {
  scoreId: string;
  overallScore: number;
  tier: ReadinessTier;
  dimensionScores: Record<string, number>;
  criticalIssueCount: number;
  passDimensionCount: number;
  headline: string;
  summary: string;
};

export const empireReadinessScoreSchema = z.object({
  scoreId: z.string().min(1),
  overallScore: z.number().min(0).max(100),
  tier: z.enum(READINESS_TIERS),
  dimensionScores: z.record(z.string(), z.number().min(0).max(100)),
  criticalIssueCount: z.number().int().min(0),
  passDimensionCount: z.number().int().min(0),
  headline: z.string().min(1),
  summary: z.string().min(1),
});

/** Validates an EmpireReadinessScore record shape. */
export function validateEmpireReadinessScore(value: unknown): EmpireReadinessScore {
  return empireReadinessScoreSchema.parse(value);
}
