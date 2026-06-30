import { z } from "zod";

export const COMPETITOR_INTELLIGENCE_SIGNAL_TYPES = [
  "competitor_coverage",
  "price_tracking",
  "creative_tracking",
  "landing_page_tracking",
  "offer_tracking",
  "review_tracking",
  "bestseller_tracking",
  "alert_quality",
  "competitor_composite",
] as const;

export type CompetitorIntelligenceSignalType =
  (typeof COMPETITOR_INTELLIGENCE_SIGNAL_TYPES)[number];

/** Scoring signal for competitor intelligence confidence. */
export type CompetitorIntelligenceSignal = {
  signalType: CompetitorIntelligenceSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const competitorIntelligenceSignalSchema = z.object({
  signalType: z.enum(COMPETITOR_INTELLIGENCE_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a CompetitorIntelligenceSignal record shape. */
export function validateCompetitorIntelligenceSignal(
  value: unknown,
): CompetitorIntelligenceSignal {
  return competitorIntelligenceSignalSchema.parse(value);
}
