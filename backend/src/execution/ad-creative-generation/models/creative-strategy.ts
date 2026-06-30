import { z } from "zod";

/** Creative strategy foundation for ad generation. */
export type CreativeStrategy = {
  primaryHook: string;
  secondaryHook: string;
  emotionalAngle: string;
  rationalAngle: string;
  painPoints: string[];
  desiredOutcomes: string[];
};

export const creativeStrategySchema = z.object({
  primaryHook: z.string().min(1),
  secondaryHook: z.string().min(1),
  emotionalAngle: z.string().min(1),
  rationalAngle: z.string().min(1),
  painPoints: z.array(z.string().min(1)).min(1),
  desiredOutcomes: z.array(z.string().min(1)).min(1),
});

/** Validates a CreativeStrategy record shape. */
export function validateCreativeStrategy(value: unknown): CreativeStrategy {
  return creativeStrategySchema.parse(value);
}
