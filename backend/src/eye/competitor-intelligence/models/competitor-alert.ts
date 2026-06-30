import { z } from "zod";

import {
  competitorChangeTypeSchema,
  type CompetitorChangeType,
} from "./competitor-change-types.js";

export const ALERT_SEVERITIES = ["HIGH", "MEDIUM", "LOW"] as const;

export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

/** Alert generated from a detected competitor change. */
export type CompetitorAlert = {
  alertId: string;
  changeId: string;
  competitorId: string;
  competitorName: string;
  changeType: CompetitorChangeType;
  severity: AlertSeverity;
  title: string;
  description: string;
  acknowledged: false;
  createdAt: string;
};

export const competitorAlertSchema = z.object({
  alertId: z.string().min(1),
  changeId: z.string().min(1),
  competitorId: z.string().min(1),
  competitorName: z.string().min(1),
  changeType: competitorChangeTypeSchema,
  severity: z.enum(ALERT_SEVERITIES),
  title: z.string().min(1),
  description: z.string().min(1),
  acknowledged: z.literal(false),
  createdAt: z.string().datetime({ offset: true }),
});

/** Validates a CompetitorAlert record shape. */
export function validateCompetitorAlert(value: unknown): CompetitorAlert {
  return competitorAlertSchema.parse(value);
}
