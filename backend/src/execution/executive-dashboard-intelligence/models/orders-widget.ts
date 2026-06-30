import { z } from "zod";

/** Executive dashboard orders widget. */
export type OrdersWidget = {
  widgetId: string;
  totalOrders: number;
  monthlyOrders: number;
  averageOrderValue: number;
  conversionRatePercent: number;
  fulfillmentRatePercent: number;
  currency: string;
  score: number;
  summary: string;
};

export const ordersWidgetSchema = z.object({
  widgetId: z.string().min(1),
  totalOrders: z.number().int().min(0),
  monthlyOrders: z.number().int().min(0),
  averageOrderValue: z.number().min(0),
  conversionRatePercent: z.number().min(0).max(100),
  fulfillmentRatePercent: z.number().min(0).max(100),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates an OrdersWidget record shape. */
export function validateOrdersWidget(value: unknown): OrdersWidget {
  return ordersWidgetSchema.parse(value);
}
