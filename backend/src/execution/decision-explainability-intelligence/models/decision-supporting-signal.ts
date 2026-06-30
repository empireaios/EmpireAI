import { z } from "zod";

export const DECISION_SUPPORTING_SIGNAL_TYPES = [
  "evidence_strength",
  "reasoning_coherence",
  "alternative_coverage",
  "tradeoff_clarity",
  "confidence_calibration",
  "decision_composite",
] as const;

export type DecisionSupportingSignalType = (typeof DECISION_SUPPORTING_SIGNAL_TYPES)[number];

/** Supporting signal for decision explainability confidence. */
export type DecisionSupportingSignal = {
  signalType: DecisionSupportingSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const decisionSupportingSignalSchema = z.object({
  signalType: z.enum(DECISION_SUPPORTING_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a DecisionSupportingSignal record shape. */
export function validateDecisionSupportingSignal(value: unknown): DecisionSupportingSignal {
  return decisionSupportingSignalSchema.parse(value);
}
