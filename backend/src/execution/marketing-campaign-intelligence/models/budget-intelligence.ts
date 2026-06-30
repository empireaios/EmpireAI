import { z } from "zod";

/** Budget and performance estimate intelligence. */
export type BudgetIntelligence = {
  minimumTestBudget: number;
  recommendedBudget: number;
  aggressiveBudget: number;
  currency: string;
  expectedCpc: number;
  expectedCpm: number;
  expectedCtr: number;
  expectedCpa: number;
  estimatedRoas: number;
  estimatedBreakeven: number;
};

export const budgetIntelligenceSchema = z.object({
  minimumTestBudget: z.number().min(0),
  recommendedBudget: z.number().min(0),
  aggressiveBudget: z.number().min(0),
  currency: z.string().length(3),
  expectedCpc: z.number().min(0),
  expectedCpm: z.number().min(0),
  expectedCtr: z.number().min(0).max(100),
  expectedCpa: z.number().min(0),
  estimatedRoas: z.number().min(0),
  estimatedBreakeven: z.number().min(0),
});

/** Validates a BudgetIntelligence record shape. */
export function validateBudgetIntelligence(value: unknown): BudgetIntelligence {
  return budgetIntelligenceSchema.parse(value);
}
