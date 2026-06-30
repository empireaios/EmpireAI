import { z } from "zod";
import { soulRecommendationSchema } from "../../executive-visual-debate/models/executive-visual-debate.js";

export const soulDecisionChamberSchema = z.object({
  moduleId: z.literal("soul-decision-chamber"),
  missionId: z.literal("REAL-056"),
  workspaceId: z.string(),
  companyId: z.string(),
  topic: z.string(),
  subjectType: z.string(),
  neverExecute: z.literal(true),
  soulRecommendation: soulRecommendationSchema,
  debateId: z.string(),
  reusedModules: z.array(z.string()),
  architectureComplete: z.literal(true),
  computedAt: z.string(),
});

export type SoulDecisionChamber = z.infer<typeof soulDecisionChamberSchema>;
