import { z } from "zod";

export const SCHEDULE_STATUSES = ["SCHEDULED", "RUNNING", "COMPLETED", "FAILED", "PAUSED"] as const;

export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

/** Engine schedule entry for coordinated execution. */
export type EngineSchedule = {
  scheduleId: string;
  engineId: string;
  engineName: string;
  cronExpression: string;
  nextRunAt: string;
  lastRunAt: string | null;
  status: ScheduleStatus;
  priority: number;
  score: number;
};

export const engineScheduleSchema = z.object({
  scheduleId: z.string().min(1),
  engineId: z.string().min(1),
  engineName: z.string().min(1),
  cronExpression: z.string().min(1),
  nextRunAt: z.string().datetime({ offset: true }),
  lastRunAt: z.string().datetime({ offset: true }).nullable(),
  status: z.enum(SCHEDULE_STATUSES),
  priority: z.number().int().min(1),
  score: z.number().min(0).max(100),
});

/** Validates an EngineSchedule record shape. */
export function validateEngineSchedule(value: unknown): EngineSchedule {
  return engineScheduleSchema.parse(value);
}
