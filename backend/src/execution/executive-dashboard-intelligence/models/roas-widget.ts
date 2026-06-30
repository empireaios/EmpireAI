import { z } from "zod";

/** Executive dashboard ROAS widget. */
export type RoasWidget = {
  widgetId: string;
  currentRoas: number;
  targetRoas: number;
  breakEvenRoas: number;
  adSpendMonthly: number;
  revenueFromAds: number;
  currency: string;
  score: number;
  summary: string;
};

export const roasWidgetSchema = z.object({
  widgetId: z.string().min(1),
  currentRoas: z.number().min(0),
  targetRoas: z.number().min(0),
  breakEvenRoas: z.number().min(0),
  adSpendMonthly: z.number().min(0),
  revenueFromAds: z.number().min(0),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a RoasWidget record shape. */
export function validateRoasWidget(value: unknown): RoasWidget {
  return roasWidgetSchema.parse(value);
}
