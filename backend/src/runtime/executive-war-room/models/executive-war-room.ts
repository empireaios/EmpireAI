import { z } from "zod";
import { chiefCardSchema, soulRecommendationSchema, grandKingDecisionSchema } from "../../executive-visual-debate/models/executive-visual-debate.js";

export const executiveWarRoomSchema = z.object({
  moduleId: z.literal("executive-war-room"),
  missionId: z.literal("REAL-055"),
  workspaceId: z.string(),
  companyId: z.string(),
  topic: z.string(),
  visualMode: z.literal(true),
  autoExecuteBlocked: z.literal(true),
  chiefCards: z.array(chiefCardSchema),
  soulRecommendation: soulRecommendationSchema,
  grandKingDecision: grandKingDecisionSchema,
  debateId: z.string(),
  reusedModules: z.array(z.string()),
  architectureComplete: z.literal(true),
  computedAt: z.string(),
});

export type ExecutiveWarRoom = z.infer<typeof executiveWarRoomSchema>;
