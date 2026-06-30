import { z } from "zod";

/** Blog content strategy for a manufactured store. */
export type BlogStrategy = {
  strategyId: string;
  objective: string;
  targetAudience: string;
  contentPillars: string[];
  publishingCadence: string;
  toneOfVoice: string;
  primaryGoals: string[];
};

export const blogStrategySchema = z.object({
  strategyId: z.string().min(1),
  objective: z.string().min(1),
  targetAudience: z.string().min(1),
  contentPillars: z.array(z.string().min(1)).min(1),
  publishingCadence: z.string().min(1),
  toneOfVoice: z.string().min(1),
  primaryGoals: z.array(z.string().min(1)).min(1),
});

/** Validates a BlogStrategy record shape. */
export function validateBlogStrategy(value: unknown): BlogStrategy {
  return blogStrategySchema.parse(value);
}
