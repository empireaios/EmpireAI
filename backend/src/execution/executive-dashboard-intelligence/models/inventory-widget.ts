import { z } from "zod";

export const INVENTORY_STATUSES = ["HEALTHY", "LOW", "CRITICAL", "OVERSTOCK"] as const;

export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

/** Executive dashboard inventory widget. */
export type InventoryWidget = {
  widgetId: string;
  totalSkus: number;
  inStockSkus: number;
  lowStockSkus: number;
  outOfStockSkus: number;
  daysOfCover: number;
  restockAlerts: number;
  status: InventoryStatus;
  score: number;
  summary: string;
};

export const inventoryWidgetSchema = z.object({
  widgetId: z.string().min(1),
  totalSkus: z.number().int().min(0),
  inStockSkus: z.number().int().min(0),
  lowStockSkus: z.number().int().min(0),
  outOfStockSkus: z.number().int().min(0),
  daysOfCover: z.number().min(0),
  restockAlerts: z.number().int().min(0),
  status: z.enum(INVENTORY_STATUSES),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates an InventoryWidget record shape. */
export function validateInventoryWidget(value: unknown): InventoryWidget {
  return inventoryWidgetSchema.parse(value);
}
