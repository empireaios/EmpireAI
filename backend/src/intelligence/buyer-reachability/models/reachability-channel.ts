import { z } from "zod";

export const REACHABILITY_CHANNEL_NAMES = [
  "Google Search",
  "Amazon",
  "TikTok",
  "Instagram",
  "Pinterest",
  "Reddit",
  "YouTube",
  "Facebook Groups",
  "AI Search",
  "Forums",
] as const;

export type ReachabilityChannelName = (typeof REACHABILITY_CHANNEL_NAMES)[number];

export const REACHABILITY_CHANNEL_TYPES = [
  "search",
  "marketplace",
  "social",
  "community",
  "ai",
  "forum",
] as const;

export type ReachabilityChannelType = (typeof REACHABILITY_CHANNEL_TYPES)[number];

/** Scored reachability channel for a buyer persona. */
export type ReachabilityChannel = {
  channelName: ReachabilityChannelName;
  channelType: ReachabilityChannelType;
  organicScore: number;
  paidScore: number;
  overallReachScore: number;
  expectedCostCents: number;
  confidence: number;
  rank: number;
};

export const reachabilityChannelSchema = z.object({
  channelName: z.enum(REACHABILITY_CHANNEL_NAMES),
  channelType: z.enum(REACHABILITY_CHANNEL_TYPES),
  organicScore: z.number().min(0).max(100),
  paidScore: z.number().min(0).max(100),
  overallReachScore: z.number().min(0).max(100),
  expectedCostCents: z.number().min(0),
  confidence: z.number().min(0).max(100),
  rank: z.number().int().min(1),
});

/** Validates a ReachabilityChannel record shape. */
export function validateReachabilityChannel(value: unknown): ReachabilityChannel {
  return reachabilityChannelSchema.parse(value);
}

export const CHANNEL_TYPE_BY_NAME: Record<ReachabilityChannelName, ReachabilityChannelType> = {
  "Google Search": "search",
  Amazon: "marketplace",
  TikTok: "social",
  Instagram: "social",
  Pinterest: "social",
  Reddit: "community",
  YouTube: "social",
  "Facebook Groups": "community",
  "AI Search": "ai",
  Forums: "forum",
};
