import { z } from "zod";

export const TRAFFIC_HEALTH_STATUSES = ["HEALTHY", "WARNING", "CRITICAL"] as const;

export type TrafficHealthStatus = (typeof TRAFFIC_HEALTH_STATUSES)[number];

/** Traffic health monitor snapshot. */
export type TrafficHealth = {
  monitorId: string;
  dailyVisitors: number;
  monthlyVisitors: number;
  bounceRatePercent: number;
  conversionRatePercent: number;
  status: TrafficHealthStatus;
  topSource: string;
  score: number;
  summary: string;
};

export const trafficHealthSchema = z.object({
  monitorId: z.string().min(1),
  dailyVisitors: z.number().int().min(0),
  monthlyVisitors: z.number().int().min(0),
  bounceRatePercent: z.number().min(0).max(100),
  conversionRatePercent: z.number().min(0).max(100),
  status: z.enum(TRAFFIC_HEALTH_STATUSES),
  topSource: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a TrafficHealth record shape. */
export function validateTrafficHealth(value: unknown): TrafficHealth {
  return trafficHealthSchema.parse(value);
}
