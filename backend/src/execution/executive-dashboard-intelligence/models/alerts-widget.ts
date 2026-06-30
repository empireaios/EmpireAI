import { z } from "zod";

export const ALERT_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const ALERT_CATEGORIES = [
  "REVENUE",
  "INVENTORY",
  "MARKETING",
  "MANUFACTURING",
  "EYE",
  "OPERATIONS",
] as const;

export type AlertCategory = (typeof ALERT_CATEGORIES)[number];

/** Single alert item on the executive dashboard. */
export type DashboardAlert = {
  alertId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  actionRequired: boolean;
};

export const dashboardAlertSchema = z.object({
  alertId: z.string().min(1),
  category: z.enum(ALERT_CATEGORIES),
  severity: z.enum(ALERT_SEVERITIES),
  title: z.string().min(1),
  message: z.string().min(1),
  actionRequired: z.boolean(),
});

/** Executive dashboard alerts widget. */
export type AlertsWidget = {
  widgetId: string;
  totalAlerts: number;
  criticalCount: number;
  highCount: number;
  alerts: DashboardAlert[];
  score: number;
  summary: string;
};

export const alertsWidgetSchema = z.object({
  widgetId: z.string().min(1),
  totalAlerts: z.number().int().min(0),
  criticalCount: z.number().int().min(0),
  highCount: z.number().int().min(0),
  alerts: z.array(dashboardAlertSchema),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates an AlertsWidget record shape. */
export function validateAlertsWidget(value: unknown): AlertsWidget {
  return alertsWidgetSchema.parse(value);
}

/** Validates a DashboardAlert record shape. */
export function validateDashboardAlert(value: unknown): DashboardAlert {
  return dashboardAlertSchema.parse(value);
}
