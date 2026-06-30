import { z } from "zod";

/** Executive dashboard Eye intelligence widget. */
export type EyeWidget = {
  widgetId: string;
  activeConnectors: number;
  signalsIngested: number;
  competitorAlerts: number;
  trendSignals: number;
  lastSyncAt: string;
  topInsight: string;
  score: number;
  summary: string;
};

export const eyeWidgetSchema = z.object({
  widgetId: z.string().min(1),
  activeConnectors: z.number().int().min(0),
  signalsIngested: z.number().int().min(0),
  competitorAlerts: z.number().int().min(0),
  trendSignals: z.number().int().min(0),
  lastSyncAt: z.string().datetime({ offset: true }),
  topInsight: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates an EyeWidget record shape. */
export function validateEyeWidget(value: unknown): EyeWidget {
  return eyeWidgetSchema.parse(value);
}
