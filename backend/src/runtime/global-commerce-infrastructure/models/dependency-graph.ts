import { z } from "zod";

export const DependencyGraphNodeTypeSchema = z.enum([
  "country",
  "marketplace",
  "payment",
  "logistics",
  "supplier",
  "advertising",
  "compliance",
  "ready",
  "layer",
]);

export type DependencyGraphNodeType = z.infer<typeof DependencyGraphNodeTypeSchema>;

export const DependencyGraphNodeSchema = z.object({
  nodeId: z.string(),
  nodeType: DependencyGraphNodeTypeSchema,
  displayName: z.string(),
  countryCode: z.string().optional(),
  providerId: z.string().optional(),
  layerId: z.string().optional(),
  status: z.enum(["COMPLETE", "PARTIAL", "MISSING", "BLOCKED", "READY"]).optional(),
  score: z.number().optional(),
});

export type DependencyGraphNode = z.infer<typeof DependencyGraphNodeSchema>;

export const DependencyGraphEdgeSchema = z.object({
  edgeId: z.string(),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  relationship: z.enum(["REQUIRES", "ENABLES", "RECOMMENDS", "LEADS_TO"]),
  requirement: z.string().optional(),
});

export type DependencyGraphEdge = z.infer<typeof DependencyGraphEdgeSchema>;

export const ExpansionDependencyGraphSchema = z.object({
  graphId: z.string(),
  countryCode: z.string(),
  displayName: z.string(),
  nodes: z.array(DependencyGraphNodeSchema),
  edges: z.array(DependencyGraphEdgeSchema),
  readyNodeId: z.string().optional(),
  computedAt: z.string(),
});

export type ExpansionDependencyGraph = z.infer<typeof ExpansionDependencyGraphSchema>;
