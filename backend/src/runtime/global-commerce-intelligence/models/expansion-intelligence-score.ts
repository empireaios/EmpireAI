import { z } from "zod";

export const ExpansionScoreDimensionSchema = z.object({
  dimensionId: z.string(),
  displayName: z.string(),
  weight: z.number().min(0).max(1),
  rawScore: z.number().min(0).max(100),
  weightedContribution: z.number().min(0).max(100),
  evidence: z.string(),
});

export type ExpansionScoreDimension = z.infer<typeof ExpansionScoreDimensionSchema>;

export const ExpansionIntelligenceScoreSchema = z.object({
  countryCode: z.string(),
  displayName: z.string(),
  expansionScore: z.number().min(0).max(100),
  grade: z.enum(["A", "B", "C", "D", "F"]),
  dimensions: z.array(ExpansionScoreDimensionSchema),
  summary: z.string(),
  computedAt: z.string(),
});

export type ExpansionIntelligenceScore = z.infer<typeof ExpansionIntelligenceScoreSchema>;
