import { z } from "zod";

export const version1GoLiveApprovalSchema = z.object({
  moduleId: z.literal("version-1-go-live-approval"),
  missionId: z.literal("REAL-099"),
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

export type Version1GoLiveApproval = z.infer<typeof version1GoLiveApprovalSchema>;
