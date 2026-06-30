import { z } from "zod";

export const ORDER_STATUSES = [
  "DRAFT",
  "READY_FOR_APPROVAL",
  "APPROVED",
  "SUBMITTED",
  "FULFILLED",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orderStatusSchema = z.enum(ORDER_STATUSES);

/** Validates an order status value. */
export function validateOrderStatus(value: unknown): OrderStatus {
  return orderStatusSchema.parse(value);
}

/** Display label for an order status. */
export function orderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    DRAFT: "Draft",
    READY_FOR_APPROVAL: "Ready for Approval",
    APPROVED: "Approved",
    SUBMITTED: "Submitted",
    FULFILLED: "Fulfilled",
    DELIVERED: "Delivered",
    FAILED: "Failed",
    CANCELLED: "Cancelled",
  };
  return labels[status];
}
