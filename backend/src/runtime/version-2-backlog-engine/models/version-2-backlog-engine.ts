import { z } from "zod";

export const BACKLOG_STATUSES = ["OPEN", "IN_REVIEW", "APPROVED_FOR_V2", "DEFERRED", "DONE"] as const;
export const BACKLOG_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export const version2BacklogEntrySchema = z.object({
  entryId: z.string(),
  origin: z.string(),
  reason: z.string(),
  businessValue: z.string(),
  architectureImpact: z.string(),
  revenueImpact: z.string(),
  uxImpact: z.string(),
  priority: z.enum(BACKLOG_PRIORITIES),
  status: z.enum(BACKLOG_STATUSES),
  relatedModules: z.array(z.string()),
  trigger: z.string(),
  owner: z.string(),
  createdAt: z.string().datetime({ offset: true }),
});

export const version2BacklogEngineSchema = z.object({
  moduleId: z.literal("version-2-backlog-engine"),
  missionId: z.literal("REAL-023"),
  workspaceId: z.string(),
  companyId: z.string(),
  entries: z.array(version2BacklogEntrySchema),
  openCount: z.number().int(),
  architectureComplete: z.boolean(),
  computedAt: z.string().datetime({ offset: true }),
});

export type Version2BacklogEntry = z.infer<typeof version2BacklogEntrySchema>;
export type Version2BacklogEngine = z.infer<typeof version2BacklogEngineSchema>;
