import { z } from "zod";

export const EXPLORATION_DIMENSIONS = [
  "country",
  "marketplace",
  "supplier",
  "category",
  "product",
] as const;

export type ExplorationDimension = (typeof EXPLORATION_DIMENSIONS)[number];

const explorationItemSchema = z.object({
  itemId: z.string(),
  dimension: z.enum(EXPLORATION_DIMENSIONS),
  name: z.string(),
  summary: z.string(),
  revenueUsd: z.number(),
  profitUsd: z.number(),
  readinessScore: z.number(),
  recommendation: z.string(),
  evidence: z.string(),
});

export const commercialExplorerSchema = z.object({
  moduleId: z.literal("commercial-explorer"),
  missionId: z.literal("REAL-066"),
  workspaceId: z.string(),
  companyId: z.string(),
  dimensions: z.array(z.enum(EXPLORATION_DIMENSIONS)),
  items: z.array(explorationItemSchema),
  topRecommendations: z.array(z.string()),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type CommercialExplorer = z.infer<typeof commercialExplorerSchema>;
