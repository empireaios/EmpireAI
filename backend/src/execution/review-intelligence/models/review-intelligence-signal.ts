import { z } from "zod";

export const REVIEW_INTELLIGENCE_SIGNAL_TYPES = [
  "sentiment_quality",
  "pain_point_coverage",
  "positive_theme_strength",
  "feature_demand",
  "competitor_gap_exploit",
  "improvement_actionability",
  "review_composite",
] as const;

export type ReviewIntelligenceSignalType = (typeof REVIEW_INTELLIGENCE_SIGNAL_TYPES)[number];

/** Scoring signal for review intelligence confidence. */
export type ReviewIntelligenceSignal = {
  signalType: ReviewIntelligenceSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const reviewIntelligenceSignalSchema = z.object({
  signalType: z.enum(REVIEW_INTELLIGENCE_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a ReviewIntelligenceSignal record shape. */
export function validateReviewIntelligenceSignal(value: unknown): ReviewIntelligenceSignal {
  return reviewIntelligenceSignalSchema.parse(value);
}
