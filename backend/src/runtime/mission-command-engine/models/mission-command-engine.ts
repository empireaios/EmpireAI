import { z } from "zod";

export const MISSION_TYPES = [
  "commercial",
  "recovery",
  "growth",
  "optimization",
  "investigation",
  "expansion",
] as const;

export const missionProposalSchema = z.object({
  missionId: z.string(),
  type: z.enum(MISSION_TYPES),
  title: z.string(),
  businessValue: z.string(),
  expectedRoi: z.number(),
  confidence: z.number().min(0).max(100),
  requiredApproval: z.literal(true),
  sourceProgramId: z.string(),
  sourceProgramName: z.string(),
  nextCursorMission: z.string(),
});

export const missionCommandEngineSchema = z.object({
  moduleId: z.literal("mission-command-engine"),
  missionId: z.literal("REAL-057"),
  workspaceId: z.string(),
  companyId: z.string(),
  missions: z.array(missionProposalSchema),
  missionCount: z.number(),
  blockingProgramCount: z.number(),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type MissionType = (typeof MISSION_TYPES)[number];
export type MissionProposal = z.infer<typeof missionProposalSchema>;
export type MissionCommandEngine = z.infer<typeof missionCommandEngineSchema>;
