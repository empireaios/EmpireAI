import { z } from "zod";

export const FounderWorkloadDashboardSchema = z.object({
  moduleId: z.literal("founder-automation"),
  missionId: z.literal("E-011-E-015"),
  todaysTasks: z.array(z.object({ taskId: z.string(), title: z.string(), priority: z.string(), blockingImpact: z.string() })),
  criticalTasks: z.array(z.object({ taskId: z.string(), title: z.string(), reason: z.string() })),
  waitingForFounder: z.number().int(),
  waitingForEmpireAI: z.number().int(),
  automationPercent: z.number().min(0).max(100),
  estimatedHoursSaved: z.number(),
  launchReadiness: z.object({
    percent: z.number(),
    phase: z.string(),
    blockers: z.number().int(),
  }),
  currentJourneyStage: z.string(),
  journeyProgressPercent: z.number(),
  computedAt: z.string(),
});

export type FounderWorkloadDashboard = z.infer<typeof FounderWorkloadDashboardSchema>;
