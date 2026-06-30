import { z } from "zod";

/** Single step in a decision reasoning chain. */
export type ReasoningStep = {
  stepOrder: number;
  claim: string;
  rationale: string;
};

export const reasoningStepSchema = z.object({
  stepOrder: z.number().int().min(1),
  claim: z.string().min(1),
  rationale: z.string().min(1),
});

/** Structured reasoning for an AI decision. */
export type DecisionReasoning = {
  reasoningId: string;
  summary: string;
  steps: ReasoningStep[];
  conclusion: string;
  score: number;
};

export const decisionReasoningSchema = z.object({
  reasoningId: z.string().min(1),
  summary: z.string().min(1),
  steps: z.array(reasoningStepSchema).min(1),
  conclusion: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a DecisionReasoning record shape. */
export function validateDecisionReasoning(value: unknown): DecisionReasoning {
  return decisionReasoningSchema.parse(value);
}

/** Validates a ReasoningStep record shape. */
export function validateReasoningStep(value: unknown): ReasoningStep {
  return reasoningStepSchema.parse(value);
}
