import { z } from "zod";

/** Interval-based polling schedule for a connector job. */
export type ConnectorPollingSchedule = {
  scheduleId: string;
  jobId: string;
  workspaceId: string;
  connectorId: string;
  intervalSec: number;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConnectorPollingScheduleCreateInput = {
  jobId: string;
  connectorId: string;
  intervalSec: number;
  enabled?: boolean;
  nextRunAt?: string | null;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const connectorPollingScheduleSchema = z.object({
  scheduleId: z.string().min(1),
  jobId: z.string().min(1),
  workspaceId: z.string().min(1),
  connectorId: z.string().min(1),
  intervalSec: z.number().int().min(1),
  enabled: z.boolean(),
  lastRunAt: isoTimestamp.nullable(),
  nextRunAt: isoTimestamp.nullable(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ConnectorPollingSchedule record shape. */
export function validateConnectorPollingSchedule(value: unknown): ConnectorPollingSchedule {
  return connectorPollingScheduleSchema.parse(value);
}

/** Computes the next run timestamp from a base time and interval. */
export function calculateNextRunAt(fromIso: string, intervalSec: number): string {
  return new Date(new Date(fromIso).getTime() + intervalSec * 1000).toISOString();
}

/** Returns true when a schedule is due at the provided timestamp. */
export function isScheduleDue(schedule: ConnectorPollingSchedule, nowIso: string): boolean {
  if (!schedule.enabled || !schedule.nextRunAt) {
    return false;
  }
  return schedule.nextRunAt <= nowIso;
}
