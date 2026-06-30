import { z } from "zod";

/** Recorded success for long-term learning. */
export type SuccessMemory = {
  memoryId: string;
  successTitle: string;
  category: string;
  description: string;
  keyFactor: string;
  replicablePattern: string;
  impactScore: number;
  occurredAt: string;
  score: number;
};

export const successMemorySchema = z.object({
  memoryId: z.string().min(1),
  successTitle: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  keyFactor: z.string().min(1),
  replicablePattern: z.string().min(1),
  impactScore: z.number().min(0).max(100),
  occurredAt: z.string().datetime({ offset: true }),
  score: z.number().min(0).max(100),
});

/** Validates a SuccessMemory record shape. */
export function validateSuccessMemory(value: unknown): SuccessMemory {
  return successMemorySchema.parse(value);
}
