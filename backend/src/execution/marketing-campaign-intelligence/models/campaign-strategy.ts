import { z } from "zod";

import { marketingChannelSchema, type MarketingChannel } from "./channel-recommendation.js";
import { campaignObjectiveSchema, type CampaignObjective } from "./campaign-objective.js";

export const CAMPAIGN_STRATEGY_TIERS = ["CONSERVATIVE", "BALANCED", "AGGRESSIVE"] as const;

export type CampaignStrategyTier = (typeof CAMPAIGN_STRATEGY_TIERS)[number];

export const campaignStrategyTierSchema = z.enum(CAMPAIGN_STRATEGY_TIERS);

/** Campaign strategy variant with rationale. */
export type CampaignStrategy = {
  tier: CampaignStrategyTier;
  objective: CampaignObjective;
  primaryChannels: MarketingChannel[];
  budgetMultiplier: number;
  rationale: string;
  expectedOutcome: string;
};

export const campaignStrategySchema = z.object({
  tier: campaignStrategyTierSchema,
  objective: campaignObjectiveSchema,
  primaryChannels: z.array(marketingChannelSchema).min(1),
  budgetMultiplier: z.number().min(0),
  rationale: z.string().min(1),
  expectedOutcome: z.string().min(1),
});

/** Validates a CampaignStrategy record shape. */
export function validateCampaignStrategy(value: unknown): CampaignStrategy {
  return campaignStrategySchema.parse(value);
}

/** Display label for a strategy tier. */
export function campaignStrategyTierLabel(tier: CampaignStrategyTier): string {
  const labels: Record<CampaignStrategyTier, string> = {
    CONSERVATIVE: "Conservative",
    BALANCED: "Balanced",
    AGGRESSIVE: "Aggressive",
  };
  return labels[tier];
}
