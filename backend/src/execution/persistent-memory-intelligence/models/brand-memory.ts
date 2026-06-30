import { z } from "zod";

/** Long-term memory entry for a brand. */
export type BrandMemory = {
  memoryId: string;
  brandName: string;
  niche: string;
  positioning: string;
  customerSentimentScore: number;
  brandRecognitionScore: number;
  keyStrengths: string[];
  improvementAreas: string[];
  score: number;
};

export const brandMemorySchema = z.object({
  memoryId: z.string().min(1),
  brandName: z.string().min(1),
  niche: z.string().min(1),
  positioning: z.string().min(1),
  customerSentimentScore: z.number().min(0).max(100),
  brandRecognitionScore: z.number().min(0).max(100),
  keyStrengths: z.array(z.string().min(1)).min(1),
  improvementAreas: z.array(z.string().min(1)),
  score: z.number().min(0).max(100),
});

/** Validates a BrandMemory record shape. */
export function validateBrandMemory(value: unknown): BrandMemory {
  return brandMemorySchema.parse(value);
}
