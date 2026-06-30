import { z } from "zod";

import {
  campaignObjectiveIntelligenceSchema,
  type CampaignObjectiveIntelligence,
} from "./campaign-objective.js";
import { audienceIntelligenceSchema, type AudienceIntelligence } from "./audience-intelligence.js";
import { budgetIntelligenceSchema, type BudgetIntelligence } from "./budget-intelligence.js";
import {
  channelRecommendationSchema,
  type ChannelRecommendation,
} from "./channel-recommendation.js";
import { campaignStrategySchema, type CampaignStrategy } from "./campaign-strategy.js";
import { campaignRiskAssessmentSchema, type CampaignRiskAssessment } from "./campaign-risk.js";
import {
  campaignRecommendationSchema,
  type CampaignRecommendation,
} from "./campaign-recommendation.js";
import {
  campaignIntelligenceSignalSchema,
  type CampaignIntelligenceSignal,
} from "./campaign-intelligence-signal.js";

export type MarketingCampaignIntelligenceId = string;

/** Full marketing campaign intelligence output — no live ad execution. */
export type MarketingCampaignIntelligence = {
  intelligenceId: MarketingCampaignIntelligenceId;
  brandId: string;
  storeId: string | null;
  campaignName: string;
  objectiveIntelligence: CampaignObjectiveIntelligence;
  channelRecommendations: ChannelRecommendation[];
  audienceIntelligence: AudienceIntelligence;
  budgetIntelligence: BudgetIntelligence;
  strategies: CampaignStrategy[];
  riskAssessment: CampaignRiskAssessment;
  recommendation: CampaignRecommendation;
  confidence: number;
  signals: CampaignIntelligenceSignal[];
  intelligenceOnly: true;
  liveAdvertisingEnabled: false;
};

export type MarketingCampaignIntelligenceCreateInput = Omit<
  MarketingCampaignIntelligence,
  "intelligenceId"
>;

export const marketingCampaignIntelligenceSchema = z.object({
  intelligenceId: z.string().min(1),
  brandId: z.string().min(1),
  storeId: z.string().nullable(),
  campaignName: z.string().min(1),
  objectiveIntelligence: campaignObjectiveIntelligenceSchema,
  channelRecommendations: z.array(channelRecommendationSchema).min(1),
  audienceIntelligence: audienceIntelligenceSchema,
  budgetIntelligence: budgetIntelligenceSchema,
  strategies: z.array(campaignStrategySchema).length(3),
  riskAssessment: campaignRiskAssessmentSchema,
  recommendation: campaignRecommendationSchema,
  confidence: z.number().min(0).max(100),
  signals: z.array(campaignIntelligenceSignalSchema),
  intelligenceOnly: z.literal(true),
  liveAdvertisingEnabled: z.literal(false),
});

/** Validates a MarketingCampaignIntelligence record shape. */
export function validateMarketingCampaignIntelligence(
  value: unknown,
): MarketingCampaignIntelligence {
  return marketingCampaignIntelligenceSchema.parse(value);
}
