import { z } from "zod";

export const IMPROVEMENT_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;

export type ImprovementPriority = (typeof IMPROVEMENT_PRIORITIES)[number];

export const IMPROVEMENT_TARGET_AREAS = [
  "PRODUCT",
  "PACKAGING",
  "SHIPPING",
  "SUPPORT",
  "PRICING",
  "FEATURES",
] as const;

export type ImprovementTargetArea = (typeof IMPROVEMENT_TARGET_AREAS)[number];

/** Product improvement recommendation derived from review analysis. */
export type ProductImprovement = {
  improvementId: string;
  priority: ImprovementPriority;
  title: string;
  description: string;
  rationale: string;
  targetArea: ImprovementTargetArea;
  expectedImpact: string;
  score: number;
};

export const productImprovementSchema = z.object({
  improvementId: z.string().min(1),
  priority: z.enum(IMPROVEMENT_PRIORITIES),
  title: z.string().min(1),
  description: z.string().min(1),
  rationale: z.string().min(1),
  targetArea: z.enum(IMPROVEMENT_TARGET_AREAS),
  expectedImpact: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a ProductImprovement record shape. */
export function validateProductImprovement(value: unknown): ProductImprovement {
  return productImprovementSchema.parse(value);
}
