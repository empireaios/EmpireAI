import { z } from "zod";
import { ExecutivePrioritySchema } from "./executive-core.js";

export const ExecutiveMissionTypeSchema = z.enum([
  "STRATEGIC_OPPORTUNITY",
  "COMMERCIAL_WARNING",
  "EXPANSION_RECOMMENDATION",
  "COST_REDUCTION",
  "SUPPLIER_CONCERN",
  "MARKETPLACE_OPPORTUNITY",
  "CUSTOMER_EXPERIENCE",
]);
export type ExecutiveMissionType = z.infer<typeof ExecutiveMissionTypeSchema>;

export const ExecutiveGeneratedMissionSchema = z.object({
  missionId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  executiveId: z.string(),
  executiveTitle: z.string(),
  type: ExecutiveMissionTypeSchema,
  title: z.string(),
  description: z.string(),
  priority: ExecutivePrioritySchema,
  confidence: z.number().min(0).max(100),
  expectedImpact: z.string(),
  awaitingKingApproval: z.boolean(),
  generatedAt: z.string(),
});
export type ExecutiveGeneratedMission = z.infer<typeof ExecutiveGeneratedMissionSchema>;
