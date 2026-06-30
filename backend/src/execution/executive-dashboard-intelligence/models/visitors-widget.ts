import { z } from "zod";

/** Executive dashboard visitors widget. */
export type VisitorsWidget = {
  widgetId: string;
  totalVisitors: number;
  monthlyVisitors: number;
  uniqueVisitors: number;
  bounceRatePercent: number;
  sessionDurationSeconds: number;
  topSource: string;
  score: number;
  summary: string;
};

export const visitorsWidgetSchema = z.object({
  widgetId: z.string().min(1),
  totalVisitors: z.number().int().min(0),
  monthlyVisitors: z.number().int().min(0),
  uniqueVisitors: z.number().int().min(0),
  bounceRatePercent: z.number().min(0).max(100),
  sessionDurationSeconds: z.number().min(0),
  topSource: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a VisitorsWidget record shape. */
export function validateVisitorsWidget(value: unknown): VisitorsWidget {
  return visitorsWidgetSchema.parse(value);
}
