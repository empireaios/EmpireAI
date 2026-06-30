import { z } from "zod";

import { searchIntentSchema, type SearchIntent } from "./keyword-cluster.js";

/** Search intent mapping for a page or keyword group. */
export type SearchIntentMapping = {
  target: string;
  intent: SearchIntent;
  rationale: string;
};

export const searchIntentMappingSchema = z.object({
  target: z.string().min(1),
  intent: searchIntentSchema,
  rationale: z.string().min(1),
});

/** Validates a SearchIntentMapping record shape. */
export function validateSearchIntentMapping(value: unknown): SearchIntentMapping {
  return searchIntentMappingSchema.parse(value);
}
