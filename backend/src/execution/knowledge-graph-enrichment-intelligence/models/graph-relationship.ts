import { z } from "zod";

export const GRAPH_RELATIONSHIP_TYPES = [
  "SUPPLIES",
  "COMPETES_WITH",
  "TARGETS",
  "BELONGS_TO",
  "CROSS_SELLS",
  "DERIVED_FROM",
  "PROMOTED_BY",
] as const;

export type GraphRelationshipType = (typeof GRAPH_RELATIONSHIP_TYPES)[number];

/** New relationship proposed for knowledge graph enrichment. */
export type GraphRelationship = {
  relationshipId: string;
  relationshipType: GraphRelationshipType;
  sourceEntityId: string;
  targetEntityId: string;
  sourceLabel: string;
  targetLabel: string;
  strength: number;
  evidence: string;
  score: number;
};

export const graphRelationshipSchema = z.object({
  relationshipId: z.string().min(1),
  relationshipType: z.enum(GRAPH_RELATIONSHIP_TYPES),
  sourceEntityId: z.string().min(1),
  targetEntityId: z.string().min(1),
  sourceLabel: z.string().min(1),
  targetLabel: z.string().min(1),
  strength: z.number().min(0).max(100),
  evidence: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a GraphRelationship record shape. */
export function validateGraphRelationship(value: unknown): GraphRelationship {
  return graphRelationshipSchema.parse(value);
}
