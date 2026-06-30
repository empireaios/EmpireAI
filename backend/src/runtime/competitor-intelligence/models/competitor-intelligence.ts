import { z } from "zod";

export const competitorProfileSchema = z.object({
  competitorId: z.string(),
  name: z.string(),
  category: z.string(),
  priceUsd: z.number(),
  positioning: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  shippingDays: z.number(),
  reviewScore: z.number(),
  mediaQualityScore: z.number(),
  seoScore: z.number(),
  categoryCoverage: z.array(z.string()),
  whyEmpireWins: z.string(),
  evidence: z.string(),
});

export const competitorIntelligenceDashboardSchema = z.object({
  moduleId: z.literal("competitor-intelligence"),
  missionId: z.literal("REAL-027"),
  workspaceId: z.string(),
  companyId: z.string(),
  competitors: z.array(competitorProfileSchema),
  executiveRecommendation: z.string(),
  recommendationEvidence: z.string(),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type CompetitorProfile = z.infer<typeof competitorProfileSchema>;
export type CompetitorIntelligenceDashboard = z.infer<typeof competitorIntelligenceDashboardSchema>;
