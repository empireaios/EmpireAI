import { z } from "zod";

import { DETECTION_SEVERITIES, type DetectionSeverity } from "./traffic-drop-detection.js";

/** Chargeback risk detection result. */
export type ChargebackRiskDetection = {
  detectionId: string;
  chargebackRatePercent: number;
  thresholdPercent: number;
  chargebackCount: number;
  chargebackTotal: number;
  topReason: string;
  detected: boolean;
  severity: DetectionSeverity;
  currency: string;
  score: number;
  summary: string;
};

export const chargebackRiskDetectionSchema = z.object({
  detectionId: z.string().min(1),
  chargebackRatePercent: z.number().min(0).max(100),
  thresholdPercent: z.number().min(0).max(100),
  chargebackCount: z.number().int().min(0),
  chargebackTotal: z.number().min(0),
  topReason: z.string().min(1),
  detected: z.boolean(),
  severity: z.enum(DETECTION_SEVERITIES),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a ChargebackRiskDetection record shape. */
export function validateChargebackRiskDetection(value: unknown): ChargebackRiskDetection {
  return chargebackRiskDetectionSchema.parse(value);
}
