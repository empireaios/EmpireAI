import { z } from "zod";

import { marketingPlatformSchema, type MarketingPlatform } from "./marketing-platform.js";

/** Platform recommendation for campaign launch distribution. */
export type PlatformRecommendation = {
  platform: MarketingPlatform;
  score: number;
  rationale: string;
  budgetTier: "LOW" | "MEDIUM" | "HIGH";
  objective: string;
};

export const platformRecommendationSchema = z.object({
  platform: marketingPlatformSchema,
  score: z.number().min(0).max(100),
  rationale: z.string().min(1),
  budgetTier: z.enum(["LOW", "MEDIUM", "HIGH"]),
  objective: z.string().min(1),
});

/** Validates a PlatformRecommendation record shape. */
export function validatePlatformRecommendation(value: unknown): PlatformRecommendation {
  return platformRecommendationSchema.parse(value);
}
