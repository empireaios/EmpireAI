import { z } from "zod";

export const SEO_SIGNAL_TYPES = [
  "keyword_coverage",
  "intent_alignment",
  "metadata_quality",
  "structured_data",
  "internal_linking",
  "topical_authority",
  "profile_composite",
] as const;

export type SeoSignalType = (typeof SEO_SIGNAL_TYPES)[number];

/** Scoring signal contributing to SEO confidence. */
export type SeoSignal = {
  signalType: SeoSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const seoSignalSchema = z.object({
  signalType: z.enum(SEO_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates an SeoSignal record shape. */
export function validateSeoSignal(value: unknown): SeoSignal {
  return seoSignalSchema.parse(value);
}
