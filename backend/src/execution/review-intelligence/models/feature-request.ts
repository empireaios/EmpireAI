import { z } from "zod";

/** Feature request extracted from customer reviews. */
export type FeatureRequest = {
  requestId: string;
  feature: string;
  description: string;
  demandScore: number;
  mentionCount: number;
};

export const featureRequestSchema = z.object({
  requestId: z.string().min(1),
  feature: z.string().min(1),
  description: z.string().min(1),
  demandScore: z.number().min(0).max(100),
  mentionCount: z.number().int().min(1),
});

/** Validates a FeatureRequest record shape. */
export function validateFeatureRequest(value: unknown): FeatureRequest {
  return featureRequestSchema.parse(value);
}
