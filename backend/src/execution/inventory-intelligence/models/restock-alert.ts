import { z } from "zod";

export const RESTOCK_ALERT_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export type RestockAlertPriority = (typeof RESTOCK_ALERT_PRIORITIES)[number];

/** Restock alert triggered by inventory prediction — planned only, no auto-order. */
export type RestockAlert = {
  alertId: string;
  sku: string;
  productName: string;
  priority: RestockAlertPriority;
  currentStock: number;
  recommendedOrderQty: number;
  daysUntilStockout: number;
  message: string;
  status: "PLANNED";
  score: number;
};

export const restockAlertSchema = z.object({
  alertId: z.string().min(1),
  sku: z.string().min(1),
  productName: z.string().min(1),
  priority: z.enum(RESTOCK_ALERT_PRIORITIES),
  currentStock: z.number().int().min(0),
  recommendedOrderQty: z.number().int().min(1),
  daysUntilStockout: z.number().min(0),
  message: z.string().min(1),
  status: z.literal("PLANNED"),
  score: z.number().min(0).max(100),
});

/** Validates a RestockAlert record shape. */
export function validateRestockAlert(value: unknown): RestockAlert {
  return restockAlertSchema.parse(value);
}
