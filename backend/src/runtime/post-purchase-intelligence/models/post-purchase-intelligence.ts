import { z } from "zod";

export const POST_PURCHASE_CATEGORIES = [
  "review",
  "refund",
  "complaint",
  "retention",
  "cross_sell",
] as const;

export const postPurchaseRecommendationSchema = z.object({
  category: z.enum(POST_PURCHASE_CATEGORIES),
  title: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  recommendation: z.string(),
  expectedImpact: z.string(),
});

export const postPurchaseIntelligenceSchema = z.object({
  moduleId: z.literal("post-purchase-intelligence"),
  missionId: z.literal("REAL-041"),
  workspaceId: z.string(),
  companyId: z.string(),
  recommendations: z.array(postPurchaseRecommendationSchema),
  summary: z.object({
    highPriorityCount: z.number(),
    retentionScore: z.number(),
    crossSellOpportunities: z.number(),
  }),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type PostPurchaseCategory = (typeof POST_PURCHASE_CATEGORIES)[number];
export type PostPurchaseIntelligence = z.infer<typeof postPurchaseIntelligenceSchema>;
