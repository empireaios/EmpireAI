import { z } from "zod";

export const LEARNING_SIGNAL_TYPES = [
  "execution_outcome",
  "task_success",
  "task_failure",
  "repeated_success",
  "repeated_failure",
  "opportunity_alignment",
  "forecast_alignment",
  "confidence_adjustment",
  "recommendation",
] as const;

export type LearningSignalType = (typeof LEARNING_SIGNAL_TYPES)[number];

/** Individual factor contributing to investigation learning. */
export type LearningSignal = {
  signalType: LearningSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const learningSignalSchema = z.object({
  signalType: z.enum(LEARNING_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a LearningSignal record shape. */
export function validateLearningSignal(value: unknown): LearningSignal {
  return learningSignalSchema.parse(value);
}
