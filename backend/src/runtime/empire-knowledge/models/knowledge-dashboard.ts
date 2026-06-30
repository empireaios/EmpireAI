import { z } from "zod";

export const EmpireKnowledgeDashboardSchema = z.object({
  moduleId: z.literal("empire-knowledge"),
  missionId: z.literal("K-001-K-005"),
  knowledgeObjects: z.object({
    total: z.number().int(),
    byType: z.record(z.number()),
  }),
  learningRecords: z.object({
    total: z.number().int(),
    byImportance: z.record(z.number()),
    bySource: z.record(z.number()),
  }),
  topDiscoveries: z.array(z.object({
    learningId: z.string(),
    observation: z.string(),
    confidence: z.number(),
    importance: z.string(),
  })),
  repeatedSuccessPatterns: z.array(z.object({
    pattern: z.string(),
    count: z.number().int(),
    evidence: z.string(),
  })),
  repeatedFailurePatterns: z.array(z.object({
    pattern: z.string(),
    count: z.number().int(),
    evidence: z.string(),
  })),
  confidenceGrowth: z.object({
    averageConfidence: z.number(),
    objectConfidence: z.number(),
    learningConfidence: z.number(),
    trend: z.enum(["GROWING", "STABLE", "INSUFFICIENT_DATA"]),
  }),
  knowledgeCoverage: z.object({
    countries: z.number().int(),
    marketplaces: z.number().int(),
    products: z.number().int(),
    suppliers: z.number().int(),
    graphEdges: z.number().int(),
    graphNodes: z.number().int(),
  }),
  computedAt: z.string(),
});

export type EmpireKnowledgeDashboard = z.infer<typeof EmpireKnowledgeDashboardSchema>;
