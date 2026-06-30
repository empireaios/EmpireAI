import { z } from "zod";

/** SEO content recommendation for topical coverage. */
export type SeoContentRecommendation = {
  recommendationId: string;
  title: string;
  targetKeyword: string;
  contentType: string;
  priority: number;
  rationale: string;
};

export const seoContentRecommendationSchema = z.object({
  recommendationId: z.string().min(1),
  title: z.string().min(1),
  targetKeyword: z.string().min(1),
  contentType: z.string().min(1),
  priority: z.number().int().min(1),
  rationale: z.string().min(1),
});

/** Validates a SeoContentRecommendation record shape. */
export function validateSeoContentRecommendation(
  value: unknown,
): SeoContentRecommendation {
  return seoContentRecommendationSchema.parse(value);
}

/** Topical authority node in the SEO map. */
export type TopicalAuthorityNode = {
  nodeId: string;
  topic: string;
  pillarPage: string;
  supportingPages: string[];
  authorityScore: number;
};

export const topicalAuthorityNodeSchema = z.object({
  nodeId: z.string().min(1),
  topic: z.string().min(1),
  pillarPage: z.string().min(1),
  supportingPages: z.array(z.string().min(1)),
  authorityScore: z.number().min(0).max(100),
});

/** Topical authority map connecting clusters to pillar content. */
export type TopicalAuthorityMap = {
  primaryTopic: string;
  nodes: TopicalAuthorityNode[];
};

export const topicalAuthorityMapSchema = z.object({
  primaryTopic: z.string().min(1),
  nodes: z.array(topicalAuthorityNodeSchema).min(1),
});

/** Validates a TopicalAuthorityMap record shape. */
export function validateTopicalAuthorityMap(value: unknown): TopicalAuthorityMap {
  return topicalAuthorityMapSchema.parse(value);
}
