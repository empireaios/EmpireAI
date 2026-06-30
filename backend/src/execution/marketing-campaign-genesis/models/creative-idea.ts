import { z } from "zod";

import { marketingPlatformSchema, type MarketingPlatform } from "./marketing-platform.js";

/** Creative concept for a launch campaign asset. */
export type CreativeIdea = {
  ideaId: string;
  format: string;
  concept: string;
  platform: MarketingPlatform;
  callToAction: string;
};

export const creativeIdeaSchema = z.object({
  ideaId: z.string().min(1),
  format: z.string().min(1),
  concept: z.string().min(1),
  platform: marketingPlatformSchema,
  callToAction: z.string().min(1),
});

/** Validates a CreativeIdea record shape. */
export function validateCreativeIdea(value: unknown): CreativeIdea {
  return creativeIdeaSchema.parse(value);
}
