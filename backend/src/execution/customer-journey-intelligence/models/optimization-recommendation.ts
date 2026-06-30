import { z } from "zod";

import { journeyStageTypeSchema, type JourneyStageType } from "./journey-stage-types.js";

export const OPTIMIZATION_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export const OPTIMIZATION_EFFORT_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;

export type OptimizationPriority = (typeof OPTIMIZATION_PRIORITIES)[number];
export type OptimizationEffortLevel = (typeof OPTIMIZATION_EFFORT_LEVELS)[number];

/** Actionable optimization recommendation for a journey stage. */
export type OptimizationRecommendation = {
  recommendationId: string;
  stageType: JourneyStageType;
  priority: OptimizationPriority;
  title: string;
  description: string;
  expectedImpact: string;
  effortLevel: OptimizationEffortLevel;
  metricTargets: string[];
};

export const optimizationRecommendationSchema = z.object({
  recommendationId: z.string().min(1),
  stageType: journeyStageTypeSchema,
  priority: z.enum(OPTIMIZATION_PRIORITIES),
  title: z.string().min(1),
  description: z.string().min(1),
  expectedImpact: z.string().min(1),
  effortLevel: z.enum(OPTIMIZATION_EFFORT_LEVELS),
  metricTargets: z.array(z.string().min(1)).min(1),
});

/** Validates an OptimizationRecommendation record shape. */
export function validateOptimizationRecommendation(value: unknown): OptimizationRecommendation {
  return optimizationRecommendationSchema.parse(value);
}
