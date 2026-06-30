import { z } from "zod";

export const CAMPAIGN_INTELLIGENCE_SIGNAL_TYPES = [
  "objective_fit",
  "channel_fit",
  "audience_clarity",
  "budget_efficiency",
  "strategy_alignment",
  "risk_adjusted",
  "intelligence_composite",
] as const;

export type CampaignIntelligenceSignalType =
  (typeof CAMPAIGN_INTELLIGENCE_SIGNAL_TYPES)[number];

/** Scoring signal contributing to campaign intelligence confidence. */
export type CampaignIntelligenceSignal = {
  signalType: CampaignIntelligenceSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const campaignIntelligenceSignalSchema = z.object({
  signalType: z.enum(CAMPAIGN_INTELLIGENCE_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a CampaignIntelligenceSignal record shape. */
export function validateCampaignIntelligenceSignal(
  value: unknown,
): CampaignIntelligenceSignal {
  return campaignIntelligenceSignalSchema.parse(value);
}
