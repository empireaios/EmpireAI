import { z } from "zod";

export const RECOMMENDATION_PRIORITIES = ["IMMEDIATE", "SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"] as const;

export type RecommendationPriority = (typeof RECOMMENDATION_PRIORITIES)[number];

/** Audit recommendation for EmpireAI improvement. */
export type AuditRecommendation = {
  recommendationId: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
  expectedImpact: string;
  effortLevel: string;
  score: number;
};

export const auditRecommendationSchema = z.object({
  recommendationId: z.string().min(1),
  priority: z.enum(RECOMMENDATION_PRIORITIES),
  title: z.string().min(1),
  description: z.string().min(1),
  expectedImpact: z.string().min(1),
  effortLevel: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates an AuditRecommendation record shape. */
export function validateAuditRecommendation(value: unknown): AuditRecommendation {
  return auditRecommendationSchema.parse(value);
}
