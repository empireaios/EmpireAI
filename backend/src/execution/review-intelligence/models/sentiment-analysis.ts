import { z } from "zod";

export const SENTIMENT_LABELS = ["POSITIVE", "NEGATIVE", "MIXED", "NEUTRAL"] as const;

export type SentimentLabel = (typeof SENTIMENT_LABELS)[number];

/** Aggregated sentiment analysis from review corpus. */
export type SentimentAnalysis = {
  analysisId: string;
  overallScore: number;
  positivePercent: number;
  negativePercent: number;
  neutralPercent: number;
  dominantSentiment: SentimentLabel;
  reviewCount: number;
  averageRating: number;
};

export const sentimentAnalysisSchema = z.object({
  analysisId: z.string().min(1),
  overallScore: z.number().min(0).max(100),
  positivePercent: z.number().min(0).max(100),
  negativePercent: z.number().min(0).max(100),
  neutralPercent: z.number().min(0).max(100),
  dominantSentiment: z.enum(SENTIMENT_LABELS),
  reviewCount: z.number().int().min(1),
  averageRating: z.number().min(0).max(5),
});

/** Validates a SentimentAnalysis record shape. */
export function validateSentimentAnalysis(value: unknown): SentimentAnalysis {
  return sentimentAnalysisSchema.parse(value);
}
