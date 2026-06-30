import { z } from "zod";

export const MARKETING_CHANNELS = [
  "META_FACEBOOK",
  "META_INSTAGRAM",
  "TIKTOK",
  "GOOGLE_SEARCH",
  "GOOGLE_SHOPPING",
  "YOUTUBE",
  "PINTEREST",
  "REDDIT",
] as const;

export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

export const marketingChannelSchema = z.enum(MARKETING_CHANNELS);

/** Validates a marketing channel value. */
export function validateMarketingChannel(value: unknown): MarketingChannel {
  return marketingChannelSchema.parse(value);
}

/** Display label for a marketing channel. */
export function marketingChannelLabel(channel: MarketingChannel): string {
  const labels: Record<MarketingChannel, string> = {
    META_FACEBOOK: "Meta Facebook",
    META_INSTAGRAM: "Meta Instagram",
    TIKTOK: "TikTok",
    GOOGLE_SEARCH: "Google Search",
    GOOGLE_SHOPPING: "Google Shopping",
    YOUTUBE: "YouTube",
    PINTEREST: "Pinterest",
    REDDIT: "Reddit",
  };
  return labels[channel];
}

/** Ranked channel recommendation with confidence. */
export type ChannelRecommendation = {
  channel: MarketingChannel;
  rank: number;
  score: number;
  confidence: number;
  rationale: string;
  fitForObjective: boolean;
};

export const channelRecommendationSchema = z.object({
  channel: marketingChannelSchema,
  rank: z.number().int().min(1),
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  rationale: z.string().min(1),
  fitForObjective: z.boolean(),
});

/** Validates a ChannelRecommendation record shape. */
export function validateChannelRecommendation(value: unknown): ChannelRecommendation {
  return channelRecommendationSchema.parse(value);
}
