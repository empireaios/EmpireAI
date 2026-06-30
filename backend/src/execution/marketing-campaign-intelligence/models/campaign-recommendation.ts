import { z } from "zod";

import { audienceIntelligenceSchema, type AudienceIntelligence } from "./audience-intelligence.js";
import { budgetIntelligenceSchema, type BudgetIntelligence } from "./budget-intelligence.js";
import { campaignStrategyTierSchema, type CampaignStrategyTier } from "./campaign-strategy.js";
import { marketingChannelSchema, type MarketingChannel } from "./channel-recommendation.js";

/** Final campaign recommendation synthesizing all intelligence layers. */
export type CampaignRecommendation = {
  recommendedStrategy: CampaignStrategyTier;
  recommendedChannel: MarketingChannel;
  recommendedAudience: AudienceIntelligence;
  recommendedBudget: BudgetIntelligence;
  expectedOutcome: string;
  confidenceScore: number;
};

export const campaignRecommendationSchema = z.object({
  recommendedStrategy: campaignStrategyTierSchema,
  recommendedChannel: marketingChannelSchema,
  recommendedAudience: audienceIntelligenceSchema,
  recommendedBudget: budgetIntelligenceSchema,
  expectedOutcome: z.string().min(1),
  confidenceScore: z.number().min(0).max(100),
});

/** Validates a CampaignRecommendation record shape. */
export function validateCampaignRecommendation(value: unknown): CampaignRecommendation {
  return campaignRecommendationSchema.parse(value);
}
