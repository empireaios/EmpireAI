import { z } from "zod";

import { croAreaTypeSchema, type CroAreaType } from "./cro-area-types.js";

export const CRO_IMPROVEMENT_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;

export type CroImprovementPriority = (typeof CRO_IMPROVEMENT_PRIORITIES)[number];

/** Priority CRO improvement with expected lift and confidence. */
export type CroPriorityImprovement = {
  improvementId: string;
  areaType: CroAreaType;
  priority: CroImprovementPriority;
  title: string;
  description: string;
  expectedLiftMin: number;
  expectedLiftMax: number;
  expectedLiftLabel: string;
  confidence: number;
  rationale: string;
};

export const croPriorityImprovementSchema = z.object({
  improvementId: z.string().min(1),
  areaType: croAreaTypeSchema,
  priority: z.enum(CRO_IMPROVEMENT_PRIORITIES),
  title: z.string().min(1),
  description: z.string().min(1),
  expectedLiftMin: z.number().min(0).max(100),
  expectedLiftMax: z.number().min(0).max(100),
  expectedLiftLabel: z.string().min(1),
  confidence: z.number().min(0).max(100),
  rationale: z.string().min(1),
});

/** Validates a CroPriorityImprovement record shape. */
export function validateCroPriorityImprovement(value: unknown): CroPriorityImprovement {
  return croPriorityImprovementSchema.parse(value);
}
