import { z } from "zod";

export const PRODUCT_MEMORY_OUTCOMES = ["SUCCESS", "NEUTRAL", "FAILURE"] as const;

export type ProductMemoryOutcome = (typeof PRODUCT_MEMORY_OUTCOMES)[number];

/** Long-term memory entry for a product. */
export type ProductMemory = {
  memoryId: string;
  productName: string;
  sku: string;
  category: string;
  outcome: ProductMemoryOutcome;
  revenueGenerated: number;
  unitsSold: number;
  lessonsLearned: string[];
  score: number;
};

export const productMemorySchema = z.object({
  memoryId: z.string().min(1),
  productName: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1),
  outcome: z.enum(PRODUCT_MEMORY_OUTCOMES),
  revenueGenerated: z.number().min(0),
  unitsSold: z.number().int().min(0),
  lessonsLearned: z.array(z.string().min(1)).min(1),
  score: z.number().min(0).max(100),
});

/** Validates a ProductMemory record shape. */
export function validateProductMemory(value: unknown): ProductMemory {
  return productMemorySchema.parse(value);
}
