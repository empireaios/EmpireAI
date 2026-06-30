import { z } from "zod";

/** Alternative option considered for an AI decision. */
export type DecisionAlternative = {
  alternativeId: string;
  label: string;
  description: string;
  expectedOutcome: string;
  projectedScore: number;
  selected: boolean;
  rejectionReason: string | null;
  score: number;
};

export const decisionAlternativeSchema = z.object({
  alternativeId: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  expectedOutcome: z.string().min(1),
  projectedScore: z.number().min(0).max(100),
  selected: z.boolean(),
  rejectionReason: z.string().min(1).nullable(),
  score: z.number().min(0).max(100),
});

/** Validates a DecisionAlternative record shape. */
export function validateDecisionAlternative(value: unknown): DecisionAlternative {
  return decisionAlternativeSchema.parse(value);
}
