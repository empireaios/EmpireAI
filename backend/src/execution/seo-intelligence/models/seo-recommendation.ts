import { z } from "zod";

export const SEO_RECOMMENDATION_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;

export type SeoRecommendationPriority = (typeof SEO_RECOMMENDATION_PRIORITIES)[number];

/** Actionable SEO recommendation. */
export type SeoRecommendation = {
  recommendationId: string;
  priority: SeoRecommendationPriority;
  category: string;
  title: string;
  action: string;
  expectedImpact: string;
};

export const seoRecommendationSchema = z.object({
  recommendationId: z.string().min(1),
  priority: z.enum(SEO_RECOMMENDATION_PRIORITIES),
  category: z.string().min(1),
  title: z.string().min(1),
  action: z.string().min(1),
  expectedImpact: z.string().min(1),
});

/** Validates a SeoRecommendation record shape. */
export function validateSeoRecommendation(value: unknown): SeoRecommendation {
  return seoRecommendationSchema.parse(value);
}
