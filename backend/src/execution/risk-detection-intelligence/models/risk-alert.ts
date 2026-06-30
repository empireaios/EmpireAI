import { z } from "zod";

import { DETECTION_SEVERITIES, type DetectionSeverity } from "./traffic-drop-detection.js";

export const RISK_ALERT_CATEGORIES = [
  "TRAFFIC",
  "SUPPLIER",
  "CAMPAIGN",
  "CHARGEBACK",
  "INVENTORY",
  "SEO",
] as const;

export type RiskAlertCategory = (typeof RISK_ALERT_CATEGORIES)[number];

/** Generated risk alert from detection engine. */
export type RiskAlert = {
  alertId: string;
  category: RiskAlertCategory;
  severity: DetectionSeverity;
  title: string;
  message: string;
  recommendedAction: string;
  actionRequired: boolean;
};

export const riskAlertSchema = z.object({
  alertId: z.string().min(1),
  category: z.enum(RISK_ALERT_CATEGORIES),
  severity: z.enum(DETECTION_SEVERITIES),
  title: z.string().min(1),
  message: z.string().min(1),
  recommendedAction: z.string().min(1),
  actionRequired: z.boolean(),
});

/** Validates a RiskAlert record shape. */
export function validateRiskAlert(value: unknown): RiskAlert {
  return riskAlertSchema.parse(value);
}
