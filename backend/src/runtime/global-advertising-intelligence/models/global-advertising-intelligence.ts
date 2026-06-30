import { z } from "zod";

export const AD_PLATFORMS = [
  "Meta",
  "Google",
  "TikTok",
  "Pinterest",
  "Reddit",
  "Microsoft",
  "Amazon Ads",
] as const;

export const adRecommendationSchema = z.object({
  platform: z.enum(AD_PLATFORMS),
  campaignType: z.string(),
  budgetUsd: z.number(),
  country: z.string(),
  marketplace: z.string(),
  creativeAngle: z.string(),
  expectedRoas: z.number(),
  expectedCacUsd: z.number(),
  expectedRoiPercent: z.number(),
  rationale: z.string(),
});

export const globalAdvertisingIntelligenceSchema = z.object({
  moduleId: z.literal("global-advertising-intelligence"),
  missionId: z.literal("REAL-038"),
  workspaceId: z.string(),
  companyId: z.string(),
  recommendOnly: z.literal(true),
  platforms: z.array(z.enum(AD_PLATFORMS)),
  recommendations: z.array(adRecommendationSchema),
  summary: z.object({
    totalRecommendedBudgetUsd: z.number(),
    avgExpectedRoas: z.number(),
    topPlatform: z.enum(AD_PLATFORMS),
  }),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type AdPlatform = (typeof AD_PLATFORMS)[number];
export type GlobalAdvertisingIntelligence = z.infer<typeof globalAdvertisingIntelligenceSchema>;
