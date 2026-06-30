import { z } from "zod";

export const CRO_SIGNAL_TYPES = [
  "headline_clarity",
  "cta_effectiveness",
  "pricing_perception",
  "trust_credibility",
  "social_proof",
  "layout_usability",
  "offer_strength",
  "urgency_balance",
  "cro_composite",
] as const;

export type CroSignalType = (typeof CRO_SIGNAL_TYPES)[number];

/** Scoring signal for CRO report confidence. */
export type CroSignal = {
  signalType: CroSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const croSignalSchema = z.object({
  signalType: z.enum(CRO_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a CroSignal record shape. */
export function validateCroSignal(value: unknown): CroSignal {
  return croSignalSchema.parse(value);
}
