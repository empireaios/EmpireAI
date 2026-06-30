import { z } from "zod";

export const productPsychologySchema = z.object({
  productId: z.string(),
  title: z.string(),
  wouldBuy: z.boolean(),
  purchaseScore: z.number().min(0).max(100),
  purchaseConfidence: z.number().min(0).max(100),
  trustScore: z.number(),
  pricePerception: z.enum(["TOO_HIGH", "FAIR", "GOOD_VALUE"]),
  imageQualityScore: z.number(),
  shippingPerception: z.enum(["SLOW", "ACCEPTABLE", "FAST"]),
  listingClarityScore: z.number(),
  urgencyScore: z.number(),
  scarcityScore: z.number(),
  valuePerceptionScore: z.number(),
  emotionalAppealScore: z.number(),
  purchaseObjections: z.array(z.string()),
  whyBuy: z.string(),
  whyNotBuy: z.string(),
  improvements: z.array(z.string()),
  evidence: z.string(),
});

export const customerPsychologyEngineDashboardSchema = z.object({
  moduleId: z.literal("customer-psychology-engine"),
  missionId: z.literal("REAL-028"),
  workspaceId: z.string(),
  companyId: z.string(),
  evaluations: z.array(productPsychologySchema),
  avgPurchaseScore: z.number(),
  launchBlockedCount: z.number(),
  executiveRecommendation: z.string(),
  recommendationEvidence: z.string(),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type ProductPsychology = z.infer<typeof productPsychologySchema>;
export type CustomerPsychologyEngineDashboard = z.infer<typeof customerPsychologyEngineDashboardSchema>;
