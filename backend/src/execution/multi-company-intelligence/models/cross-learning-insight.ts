import { z } from "zod";

export const CROSS_LEARNING_CATEGORIES = [
  "MARKETING",
  "PRODUCT",
  "PRICING",
  "SUPPLIER",
  "OPERATIONS",
  "CONVERSION",
] as const;

export type CrossLearningCategory = (typeof CROSS_LEARNING_CATEGORIES)[number];

/** Cross-company learning insight. */
export type CrossLearningInsight = {
  insightId: string;
  category: CrossLearningCategory;
  sourceCompany: string;
  targetCompanies: string[];
  insight: string;
  replicablePattern: string;
  impactScore: number;
  score: number;
};

export const crossLearningInsightSchema = z.object({
  insightId: z.string().min(1),
  category: z.enum(CROSS_LEARNING_CATEGORIES),
  sourceCompany: z.string().min(1),
  targetCompanies: z.array(z.string().min(1)).min(1),
  insight: z.string().min(1),
  replicablePattern: z.string().min(1),
  impactScore: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
});

/** Validates a CrossLearningInsight record shape. */
export function validateCrossLearningInsight(value: unknown): CrossLearningInsight {
  return crossLearningInsightSchema.parse(value);
}
