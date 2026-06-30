import { z } from "zod";

export const RISK_DETECTION_SIGNAL_TYPES = [
  "traffic_drop",
  "supplier_failure",
  "campaign_failure",
  "chargeback_risk",
  "inventory_risk",
  "seo_penalty",
  "alert_coverage",
  "detection_composite",
] as const;

export type RiskDetectionSignalType = (typeof RISK_DETECTION_SIGNAL_TYPES)[number];

/** Scoring signal for risk detection confidence. */
export type RiskDetectionSignal = {
  signalType: RiskDetectionSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const riskDetectionSignalSchema = z.object({
  signalType: z.enum(RISK_DETECTION_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a RiskDetectionSignal record shape. */
export function validateRiskDetectionSignal(value: unknown): RiskDetectionSignal {
  return riskDetectionSignalSchema.parse(value);
}
