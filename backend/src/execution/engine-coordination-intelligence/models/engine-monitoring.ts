import { z } from "zod";

export const MONITORING_STATUSES = ["HEALTHY", "DEGRADED", "FAILED", "UNKNOWN"] as const;

export type MonitoringStatus = (typeof MONITORING_STATUSES)[number];

/** Engine monitoring snapshot for coordination health. */
export type EngineMonitoring = {
  monitorId: string;
  engineId: string;
  engineName: string;
  status: MonitoringStatus;
  lastHeartbeatAt: string;
  averageDurationMs: number;
  successRatePercent: number;
  activeExecutions: number;
  score: number;
  summary: string;
};

export const engineMonitoringSchema = z.object({
  monitorId: z.string().min(1),
  engineId: z.string().min(1),
  engineName: z.string().min(1),
  status: z.enum(MONITORING_STATUSES),
  lastHeartbeatAt: z.string().datetime({ offset: true }),
  averageDurationMs: z.number().min(0),
  successRatePercent: z.number().min(0).max(100),
  activeExecutions: z.number().int().min(0),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates an EngineMonitoring record shape. */
export function validateEngineMonitoring(value: unknown): EngineMonitoring {
  return engineMonitoringSchema.parse(value);
}
