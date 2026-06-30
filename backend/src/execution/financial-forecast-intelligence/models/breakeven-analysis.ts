import { z } from "zod";

/** Breakeven analysis for the store. */
export type BreakevenAnalysis = {
  analysisId: string;
  breakevenRevenue: number;
  breakevenUnits: number;
  fixedCostsMonthly: number;
  variableCostPerUnit: number;
  averageOrderValue: number;
  monthsToBreakeven: number;
  currency: string;
  score: number;
};

export const breakevenAnalysisSchema = z.object({
  analysisId: z.string().min(1),
  breakevenRevenue: z.number().min(0),
  breakevenUnits: z.number().int().min(0),
  fixedCostsMonthly: z.number().min(0),
  variableCostPerUnit: z.number().min(0),
  averageOrderValue: z.number().min(0),
  monthsToBreakeven: z.number().min(0),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a BreakevenAnalysis record shape. */
export function validateBreakevenAnalysis(value: unknown): BreakevenAnalysis {
  return breakevenAnalysisSchema.parse(value);
}
