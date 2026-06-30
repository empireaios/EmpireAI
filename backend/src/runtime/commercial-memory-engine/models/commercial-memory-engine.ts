import { z } from "zod";

export const COMMERCIAL_MEMORY_CATEGORIES = [
  "winning",
  "failed",
  "lessons",
] as const;

export const memoryCategorySchema = z.object({
  category: z.enum(COMMERCIAL_MEMORY_CATEGORIES),
  label: z.string(),
  activeCount: z.number(),
  lessonFocus: z.string(),
});

export const commercialMemoryEngineSchema = z.object({
  moduleId: z.literal("commercial-memory-engine"),
  missionId: z.literal("REAL-060"),
  workspaceId: z.string(),
  companyId: z.string(),
  summary: z.object({
    totalMemories: z.number(),
    byCategory: z.record(z.number()),
    computedAt: z.string(),
  }),
  categories: z.array(memoryCategorySchema),
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

export type CommercialMemoryCategory = (typeof COMMERCIAL_MEMORY_CATEGORIES)[number];
export type CommercialMemoryEngine = z.infer<typeof commercialMemoryEngineSchema>;
