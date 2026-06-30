import { z } from "zod";

export const TIMELINE_EVENT_TYPES = [
  "pipeline",
  "program",
  "approval",
  "launch",
  "milestone",
] as const;

export const timelineEventSchema = z.object({
  eventId: z.string(),
  type: z.enum(TIMELINE_EVENT_TYPES),
  title: z.string(),
  scheduledAt: z.string(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETE", "BLOCKED"]),
  sourceModule: z.string(),
  summary: z.string(),
});

export const globalExecutionTimelineSchema = z.object({
  moduleId: z.literal("global-execution-timeline"),
  missionId: z.literal("REAL-058"),
  workspaceId: z.string(),
  companyId: z.string(),
  events: z.array(timelineEventSchema),
  eventCount: z.number(),
  upcomingCount: z.number(),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];
export type TimelineEvent = z.infer<typeof timelineEventSchema>;
export type GlobalExecutionTimeline = z.infer<typeof globalExecutionTimelineSchema>;
