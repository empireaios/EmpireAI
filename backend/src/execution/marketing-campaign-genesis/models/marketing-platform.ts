import { z } from "zod";

export const MARKETING_PLATFORMS = [
  "FACEBOOK",
  "INSTAGRAM",
  "TIKTOK",
  "GOOGLE",
] as const;

export type MarketingPlatform = (typeof MARKETING_PLATFORMS)[number];

export const marketingPlatformSchema = z.enum(MARKETING_PLATFORMS);

/** Validates a marketing platform value. */
export function validateMarketingPlatform(value: unknown): MarketingPlatform {
  return marketingPlatformSchema.parse(value);
}

/** Display label for a marketing platform. */
export function marketingPlatformLabel(platform: MarketingPlatform): string {
  const labels: Record<MarketingPlatform, string> = {
    FACEBOOK: "Facebook",
    INSTAGRAM: "Instagram",
    TIKTOK: "TikTok",
    GOOGLE: "Google",
  };
  return labels[platform];
}
