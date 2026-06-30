import { z } from "zod";

/** Safety stock recommendation to buffer demand variability. */
export type SafetyStock = {
  safetyStockId: string;
  recommendedUnits: number;
  currentUnits: number;
  reorderPoint: number;
  daysOfCover: number;
  rationale: string;
  score: number;
};

export const safetyStockSchema = z.object({
  safetyStockId: z.string().min(1),
  recommendedUnits: z.number().int().min(0),
  currentUnits: z.number().int().min(0),
  reorderPoint: z.number().int().min(0),
  daysOfCover: z.number().min(0),
  rationale: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a SafetyStock record shape. */
export function validateSafetyStock(value: unknown): SafetyStock {
  return safetyStockSchema.parse(value);
}
