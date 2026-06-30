import { z } from "zod";

import { adAngleSchema, type AdAngle } from "./ad-angle.js";
import { creativeIdeaSchema, type CreativeIdea } from "./creative-idea.js";
import {
  platformRecommendationSchema,
  type PlatformRecommendation,
} from "./platform-recommendation.js";
import {
  campaignGenesisSignalSchema,
  type CampaignGenesisSignal,
} from "./campaign-genesis-signal.js";

export type MarketingCampaignId = string;

/** Launch campaign generated for a brand and offer. */
export type MarketingCampaign = {
  campaignId: MarketingCampaignId;
  campaignName: string;
  targetAudience: string;
  adAngles: AdAngle[];
  creativeIdeas: CreativeIdea[];
  platformRecommendations: PlatformRecommendation[];
  confidence: number;
  signals: CampaignGenesisSignal[];
};

export type MarketingCampaignCreateInput = Omit<MarketingCampaign, "campaignId">;

export const marketingCampaignSchema = z.object({
  campaignId: z.string().min(1),
  campaignName: z.string().min(1),
  targetAudience: z.string().min(1),
  adAngles: z.array(adAngleSchema).min(1),
  creativeIdeas: z.array(creativeIdeaSchema).min(1),
  platformRecommendations: z.array(platformRecommendationSchema).min(1),
  confidence: z.number().min(0).max(100),
  signals: z.array(campaignGenesisSignalSchema),
});

/** Validates a MarketingCampaign record shape. */
export function validateMarketingCampaign(value: unknown): MarketingCampaign {
  return marketingCampaignSchema.parse(value);
}
