import { z } from "zod";

export const SUPPLIER_MEMORY_OUTCOMES = ["TRUSTED", "ACCEPTABLE", "PROBLEMATIC"] as const;

export type SupplierMemoryOutcome = (typeof SUPPLIER_MEMORY_OUTCOMES)[number];

/** Long-term memory entry for a supplier relationship. */
export type SupplierMemory = {
  memoryId: string;
  supplierName: string;
  outcome: SupplierMemoryOutcome;
  fulfillmentRatePercent: number;
  averageLeadTimeDays: number;
  qualityScore: number;
  lessonsLearned: string[];
  score: number;
};

export const supplierMemorySchema = z.object({
  memoryId: z.string().min(1),
  supplierName: z.string().min(1),
  outcome: z.enum(SUPPLIER_MEMORY_OUTCOMES),
  fulfillmentRatePercent: z.number().min(0).max(100),
  averageLeadTimeDays: z.number().min(0),
  qualityScore: z.number().min(0).max(100),
  lessonsLearned: z.array(z.string().min(1)).min(1),
  score: z.number().min(0).max(100),
});

/** Validates a SupplierMemory record shape. */
export function validateSupplierMemory(value: unknown): SupplierMemory {
  return supplierMemorySchema.parse(value);
}
