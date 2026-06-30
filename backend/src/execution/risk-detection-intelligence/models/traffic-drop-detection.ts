import { z } from "zod";

export const DETECTION_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export type DetectionSeverity = (typeof DETECTION_SEVERITIES)[number];

/** Traffic drop detection result. */
export type TrafficDropDetection = {
  detectionId: string;
  currentDailyVisitors: number;
  previousDailyVisitors: number;
  dropPercent: number;
  thresholdPercent: number;
  detected: boolean;
  severity: DetectionSeverity;
  score: number;
  summary: string;
};

export const trafficDropDetectionSchema = z.object({
  detectionId: z.string().min(1),
  currentDailyVisitors: z.number().int().min(0),
  previousDailyVisitors: z.number().int().min(0),
  dropPercent: z.number().min(0).max(100),
  thresholdPercent: z.number().min(0).max(100),
  detected: z.boolean(),
  severity: z.enum(DETECTION_SEVERITIES),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a TrafficDropDetection record shape. */
export function validateTrafficDropDetection(value: unknown): TrafficDropDetection {
  return trafficDropDetectionSchema.parse(value);
}
