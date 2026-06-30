import { z } from "zod";

export const IMPROVEMENT_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;

export type ImprovementPriority = (typeof IMPROVEMENT_PRIORITIES)[number];

/** Recommendation to improve future decisions from accumulated memory. */
export type DecisionImprovement = {
  improvementId: string;
  priority: ImprovementPriority;
  decisionArea: string;
  recommendation: string;
  rationale: string;
  basedOnMemory: string[];
  expectedImpactPercent: number;
  score: number;
};

export const decisionImprovementSchema = z.object({
  improvementId: z.string().min(1),
  priority: z.enum(IMPROVEMENT_PRIORITIES),
  decisionArea: z.string().min(1),
  recommendation: z.string().min(1),
  rationale: z.string().min(1),
  basedOnMemory: z.array(z.string().min(1)).min(1),
  expectedImpactPercent: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
});

/** Validates a DecisionImprovement record shape. */
export function validateDecisionImprovement(value: unknown): DecisionImprovement {
  return decisionImprovementSchema.parse(value);
}
