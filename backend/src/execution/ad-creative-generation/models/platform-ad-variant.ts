import { z } from "zod";

export const AD_CREATIVE_PLATFORMS = [
  "FACEBOOK",
  "INSTAGRAM",
  "TIKTOK",
  "YOUTUBE_SHORTS",
  "PINTEREST",
] as const;

export type AdCreativePlatform = (typeof AD_CREATIVE_PLATFORMS)[number];

export const adCreativePlatformSchema = z.enum(AD_CREATIVE_PLATFORMS);

/** Platform-optimized ad creative variant. */
export type PlatformAdVariant = {
  variantId: string;
  platform: AdCreativePlatform;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  formatRecommendation: string;
  optimizationNotes: string;
};

export const platformAdVariantSchema = z.object({
  variantId: z.string().min(1),
  platform: adCreativePlatformSchema,
  headline: z.string().min(1),
  primaryText: z.string().min(1),
  description: z.string().min(1),
  callToAction: z.string().min(1),
  formatRecommendation: z.string().min(1),
  optimizationNotes: z.string().min(1),
});

/** Validates a PlatformAdVariant record shape. */
export function validatePlatformAdVariant(value: unknown): PlatformAdVariant {
  return platformAdVariantSchema.parse(value);
}

/** Display label for an ad creative platform. */
export function adCreativePlatformLabel(platform: AdCreativePlatform): string {
  const labels: Record<AdCreativePlatform, string> = {
    FACEBOOK: "Facebook",
    INSTAGRAM: "Instagram",
    TIKTOK: "TikTok",
    YOUTUBE_SHORTS: "YouTube Shorts",
    PINTEREST: "Pinterest",
  };
  return labels[platform];
}
