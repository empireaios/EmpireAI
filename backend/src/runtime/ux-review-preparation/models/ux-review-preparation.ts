import { z } from "zod";

export const uxReviewPreparationSchema = z.object({
  moduleId: z.literal("ux-review-preparation"),
  missionId: z.literal("REAL-092"),
  workspaceId: z.string(),
  companyId: z.string(),
  summary: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    label: z.string(),
    score: z.number(),
    status: z.enum(["READY", "PENDING", "BLOCKED"]),
    recommendation: z.string(),
    evidence: z.string(),
    why: z.string(),
  })),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type UxReviewPreparation = z.infer<typeof uxReviewPreparationSchema>;
