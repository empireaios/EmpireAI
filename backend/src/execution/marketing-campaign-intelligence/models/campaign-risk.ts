import { z } from "zod";

/** Campaign risk assessment before any live ad spend. */
export type CampaignRiskAssessment = {
  marketSaturation: number;
  competitionLevel: number;
  creativeFatigueRisk: number;
  budgetRisk: number;
  expectedLearningPeriodDays: number;
  overallRiskScore: number;
  riskTier: "LOW" | "MODERATE" | "HIGH";
  summary: string;
};

export const campaignRiskAssessmentSchema = z.object({
  marketSaturation: z.number().min(0).max(100),
  competitionLevel: z.number().min(0).max(100),
  creativeFatigueRisk: z.number().min(0).max(100),
  budgetRisk: z.number().min(0).max(100),
  expectedLearningPeriodDays: z.number().int().min(0),
  overallRiskScore: z.number().min(0).max(100),
  riskTier: z.enum(["LOW", "MODERATE", "HIGH"]),
  summary: z.string().min(1),
});

/** Validates a CampaignRiskAssessment record shape. */
export function validateCampaignRiskAssessment(value: unknown): CampaignRiskAssessment {
  return campaignRiskAssessmentSchema.parse(value);
}
