import { z } from "zod";

export const CAMPAIGN_MEMORY_OUTCOMES = ["SUCCESS", "NEUTRAL", "FAILURE"] as const;

export type CampaignMemoryOutcome = (typeof CAMPAIGN_MEMORY_OUTCOMES)[number];

/** Long-term memory entry for a marketing campaign. */
export type CampaignMemory = {
  memoryId: string;
  campaignName: string;
  channel: string;
  outcome: CampaignMemoryOutcome;
  roasAchieved: number;
  spendTotal: number;
  conversions: number;
  lessonsLearned: string[];
  score: number;
};

export const campaignMemorySchema = z.object({
  memoryId: z.string().min(1),
  campaignName: z.string().min(1),
  channel: z.string().min(1),
  outcome: z.enum(CAMPAIGN_MEMORY_OUTCOMES),
  roasAchieved: z.number().min(0),
  spendTotal: z.number().min(0),
  conversions: z.number().int().min(0),
  lessonsLearned: z.array(z.string().min(1)).min(1),
  score: z.number().min(0).max(100),
});

/** Validates a CampaignMemory record shape. */
export function validateCampaignMemory(value: unknown): CampaignMemory {
  return campaignMemorySchema.parse(value);
}
