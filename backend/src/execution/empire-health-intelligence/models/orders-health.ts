import { z } from "zod";

export const ORDERS_HEALTH_STATUSES = ["HEALTHY", "WARNING", "CRITICAL"] as const;

export type OrdersHealthStatus = (typeof ORDERS_HEALTH_STATUSES)[number];

/** Orders health monitor snapshot. */
export type OrdersHealth = {
  monitorId: string;
  dailyOrders: number;
  monthlyOrders: number;
  averageOrderValue: number;
  fulfillmentRatePercent: number;
  status: OrdersHealthStatus;
  currency: string;
  score: number;
  summary: string;
};

export const ordersHealthSchema = z.object({
  monitorId: z.string().min(1),
  dailyOrders: z.number().int().min(0),
  monthlyOrders: z.number().int().min(0),
  averageOrderValue: z.number().min(0),
  fulfillmentRatePercent: z.number().min(0).max(100),
  status: z.enum(ORDERS_HEALTH_STATUSES),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates an OrdersHealth record shape. */
export function validateOrdersHealth(value: unknown): OrdersHealth {
  return ordersHealthSchema.parse(value);
}
