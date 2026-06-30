import { z } from "zod";

export const SEARCH_INTENTS = [
  "INFORMATIONAL",
  "COMMERCIAL",
  "TRANSACTIONAL",
  "NAVIGATIONAL",
] as const;

export type SearchIntent = (typeof SEARCH_INTENTS)[number];

export const searchIntentSchema = z.enum(SEARCH_INTENTS);

/** Keyword cluster grouped by search intent. */
export type KeywordCluster = {
  clusterId: string;
  name: string;
  primaryKeyword: string;
  keywords: string[];
  searchIntent: SearchIntent;
  priority: number;
  rationale: string;
};

export const keywordClusterSchema = z.object({
  clusterId: z.string().min(1),
  name: z.string().min(1),
  primaryKeyword: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  searchIntent: searchIntentSchema,
  priority: z.number().int().min(1),
  rationale: z.string().min(1),
});

/** Validates a KeywordCluster record shape. */
export function validateKeywordCluster(value: unknown): KeywordCluster {
  return keywordClusterSchema.parse(value);
}
