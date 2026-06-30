import { z } from "zod";

export const KNOWLEDGE_LEARNING_SOURCES = [
  "products",
  "countries",
  "customers",
  "suppliers",
  "marketplaces",
  "executives",
  "soul",
  "grand_king",
] as const;

export const learningSourceSchema = z.object({
  sourceId: z.enum(KNOWLEDGE_LEARNING_SOURCES),
  label: z.string(),
  objectCount: z.number(),
  learningCount: z.number(),
  confidence: z.number(),
});

export const globalKnowledgeEvolutionSchema = z.object({
  moduleId: z.literal("global-knowledge-evolution"),
  missionId: z.literal("REAL-042"),
  workspaceId: z.string(),
  companyId: z.string(),
  empireKnowledge: z.record(z.unknown()),
  learningSources: z.array(learningSourceSchema),
  evolutionSummary: z.object({
    totalObjects: z.number(),
    totalLearnings: z.number(),
    avgConfidence: z.number(),
    trend: z.string(),
  }),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type KnowledgeLearningSource = (typeof KNOWLEDGE_LEARNING_SOURCES)[number];
export type GlobalKnowledgeEvolution = z.infer<typeof globalKnowledgeEvolutionSchema>;
