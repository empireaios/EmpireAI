import { z } from "zod";

export const CAMPAIGN_GENESIS_SIGNAL_TYPES = [
  "brand_alignment",
  "audience_clarity",
  "angle_strength",
  "creative_coverage",
  "platform_fit",
  "campaign_composite",
] as const;

export type CampaignGenesisSignalType = (typeof CAMPAIGN_GENESIS_SIGNAL_TYPES)[number];

/** Individual factor contributing to marketing campaign genesis scoring. */
export type CampaignGenesisSignal = {
  signalType: CampaignGenesisSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const campaignGenesisSignalSchema = z.object({
  signalType: z.enum(CAMPAIGN_GENESIS_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a CampaignGenesisSignal record shape. */
export function validateCampaignGenesisSignal(value: unknown): CampaignGenesisSignal {
  return campaignGenesisSignalSchema.parse(value);
}
