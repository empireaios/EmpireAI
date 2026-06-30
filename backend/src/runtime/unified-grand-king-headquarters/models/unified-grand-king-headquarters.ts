import { z } from "zod";

export const headquartersSectionStatusSchema = z.enum(["READY", "ACTIVE", "PENDING", "BLOCKED"]);

export const headquartersSectionSchema = z.object({
  moduleId: z.string(),
  label: z.string(),
  summary: z.string(),
  status: headquartersSectionStatusSchema,
});

export const unifiedGrandKingHeadquartersSchema = z.object({
  moduleId: z.literal("unified-grand-king-headquarters"),
  missionId: z.literal("REAL-051"),
  workspaceId: z.string(),
  companyId: z.string(),
  morningBrief: z.string(),
  operationsMode: z.string(),
  programSummary: z.object({
    programCount: z.number(),
    avgCompletion: z.number(),
    blockingPrograms: z.number(),
  }),
  sections: z.array(headquartersSectionSchema),
  reusedModules: z.array(z.string()),
  architectureComplete: z.literal(true),
  computedAt: z.string(),
});

export type HeadquartersSectionStatus = z.infer<typeof headquartersSectionStatusSchema>;
export type HeadquartersSection = z.infer<typeof headquartersSectionSchema>;
export type UnifiedGrandKingHeadquarters = z.infer<typeof unifiedGrandKingHeadquartersSchema>;
