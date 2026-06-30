import { z } from "zod";

export const GRAPH_ENTITY_TYPES = [
  "PRODUCT",
  "BRAND",
  "SUPPLIER",
  "BUYER_PERSONA",
  "CAMPAIGN",
  "CATEGORY",
  "MARKET",
] as const;

export type GraphEntityType = (typeof GRAPH_ENTITY_TYPES)[number];

/** New entity proposed for knowledge graph enrichment. */
export type GraphEntity = {
  entityId: string;
  entityType: GraphEntityType;
  label: string;
  description: string;
  sourceModule: string;
  confidence: number;
  score: number;
};

export const graphEntitySchema = z.object({
  entityId: z.string().min(1),
  entityType: z.enum(GRAPH_ENTITY_TYPES),
  label: z.string().min(1),
  description: z.string().min(1),
  sourceModule: z.string().min(1),
  confidence: z.number().min(0).max(100),
  score: z.number().min(0).max(100),
});

/** Validates a GraphEntity record shape. */
export function validateGraphEntity(value: unknown): GraphEntity {
  return graphEntitySchema.parse(value);
}
