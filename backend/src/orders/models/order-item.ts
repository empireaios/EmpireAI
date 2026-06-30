import { z } from "zod";

/** Line item within an EmpireAI order. */
export type OrderItem = {
  itemId: string;
  supplierSku: string;
  supplierProductId: string | null;
  title: string;
  quantity: number;
  unitCost: number;
  currency: string;
};

export const orderItemSchema = z.object({
  itemId: z.string().min(1),
  supplierSku: z.string().min(1),
  supplierProductId: z.string().nullable(),
  title: z.string().min(1),
  quantity: z.number().int().min(1),
  unitCost: z.number().min(0),
  currency: z.string().length(3),
});

/** Validates an OrderItem record shape. */
export function validateOrderItem(value: unknown): OrderItem {
  return orderItemSchema.parse(value);
}
