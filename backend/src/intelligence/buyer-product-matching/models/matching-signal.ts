import { z } from "zod";

export const MATCHING_SIGNAL_TYPES = [
  "category_alignment",
  "interest_alignment",
  "age_alignment",
  "keyword_alignment",
  "persona_strength",
] as const;

export type MatchingSignalType = (typeof MATCHING_SIGNAL_TYPES)[number];

/** Individual scoring signal contributing to a buyer-product match. */
export type MatchingSignal = {
  signalType: MatchingSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const matchingSignalSchema = z.object({
  signalType: z.enum(MATCHING_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a MatchingSignal record shape. */
export function validateMatchingSignal(value: unknown): MatchingSignal {
  return matchingSignalSchema.parse(value);
}
