import { z } from "zod";

export const KnowledgeRelationshipSchema = z.enum([
  "SUCCEEDED_ON",
  "FAILED_ON",
  "LAUNCHED_IN",
  "SUPPLIED_BY",
  "TARGETS",
  "COMPETES_WITH",
  "USES_PAYMENT",
  "USES_LOGISTICS",
  "PROMOTED_VIA",
  "LEARNED_FROM",
  "RELATED_TO",
  "PERFORMED_BEST_ON",
  "PERFORMED_WORST_ON",
]);

export type KnowledgeRelationship = z.infer<typeof KnowledgeRelationshipSchema>;

export const KnowledgeEdgeSchema = z.object({
  edgeId: z.string(),
  workspaceId: z.string(),
  fromObjectId: z.string(),
  toObjectId: z.string(),
  relationship: KnowledgeRelationshipSchema,
  weight: z.number().min(0).max(100).default(50),
  evidence: z.string().optional(),
  createdAt: z.string(),
});

export type KnowledgeEdge = z.infer<typeof KnowledgeEdgeSchema>;

export const GraphQueryResultSchema = z.object({
  rootObjectId: z.string(),
  nodes: z.array(z.object({
    objectId: z.string(),
    objectType: z.string(),
    displayName: z.string(),
  })),
  edges: z.array(KnowledgeEdgeSchema),
  depth: z.number().int(),
});

export type GraphQueryResult = z.infer<typeof GraphQueryResultSchema>;

export const CreateKnowledgeEdgeInputSchema = z.object({
  fromObjectId: z.string(),
  toObjectId: z.string(),
  relationship: KnowledgeRelationshipSchema,
  weight: z.number().min(0).max(100).optional(),
  evidence: z.string().optional(),
});

export type CreateKnowledgeEdgeInput = z.input<typeof CreateKnowledgeEdgeInputSchema>;
