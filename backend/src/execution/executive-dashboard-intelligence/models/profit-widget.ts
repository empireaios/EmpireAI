import { z } from "zod";

/** Executive dashboard profit widget. */
export type ProfitWidget = {
  widgetId: string;
  netProfit: number;
  grossProfit: number;
  grossMarginPercent: number;
  netMarginPercent: number;
  monthlyProfit: number;
  currency: string;
  score: number;
  summary: string;
};

export const profitWidgetSchema = z.object({
  widgetId: z.string().min(1),
  netProfit: z.number(),
  grossProfit: z.number(),
  grossMarginPercent: z.number().min(0).max(100),
  netMarginPercent: z.number().min(-100).max(100),
  monthlyProfit: z.number(),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a ProfitWidget record shape. */
export function validateProfitWidget(value: unknown): ProfitWidget {
  return profitWidgetSchema.parse(value);
}
