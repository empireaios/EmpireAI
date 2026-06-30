import { z } from "zod";

export const CERTAINTY_LEVELS = ["HIGH", "MEDIUM", "LOW"] as const;

export type CertaintyLevel = (typeof CERTAINTY_LEVELS)[number];

/** Confidence assessment for an AI decision. */
export type DecisionConfidence = {
  assessmentId: string;
  overallConfidence: number;
  certaintyLevel: CertaintyLevel;
  factors: string[];
  uncertaintyNotes: string[];
  score: number;
};

export const decisionConfidenceSchema = z.object({
  assessmentId: z.string().min(1),
  overallConfidence: z.number().min(0).max(100),
  certaintyLevel: z.enum(CERTAINTY_LEVELS),
  factors: z.array(z.string().min(1)).min(1),
  uncertaintyNotes: z.array(z.string().min(1)),
  score: z.number().min(0).max(100),
});

/** Validates a DecisionConfidence record shape. */
export function validateDecisionConfidence(value: unknown): DecisionConfidence {
  return decisionConfidenceSchema.parse(value);
}
