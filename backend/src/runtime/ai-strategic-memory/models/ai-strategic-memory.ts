import { z } from "zod";
import { STRATEGIC_MEMORY_CATEGORIES } from "../../../foundation/strategic-memory-engine/models/strategic-memory.js";

export const memoryCategorySummarySchema = z.object({
  category: z.enum(STRATEGIC_MEMORY_CATEGORIES),
  label: z.string(),
  activeCount: z.number(),
  lessonFocus: z.string(),
});

export const aiStrategicMemorySchema = z.object({
  moduleId: z.literal("ai-strategic-memory"),
  missionId: z.literal("REAL-043"),
  workspaceId: z.string(),
  companyId: z.string(),
  summary: z.object({
    totalMemories: z.number(),
    byCategory: z.record(z.number()),
    computedAt: z.string(),
  }),
  categories: z.array(memoryCategorySummarySchema),
  recentMemories: z.array(z.object({
    memoryId: z.string(),
    category: z.string(),
    title: z.string(),
    importance: z.number(),
  })),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type AiStrategicMemory = z.infer<typeof aiStrategicMemorySchema>;
