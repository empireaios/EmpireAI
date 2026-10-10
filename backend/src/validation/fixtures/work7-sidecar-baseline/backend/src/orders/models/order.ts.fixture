import { z } from "zod";

import { orderItemSchema, type OrderItem } from "./order-item.js";
import { orderStatusSchema, type OrderStatus } from "./order-status.js";
import { fulfillmentStatusSchema, type FulfillmentStatus } from "./fulfillment-status.js";
import { trackingEventSchema, type TrackingEvent } from "./tracking-event.js";

export type OrderId = string;

/** Approval gate required before any CJ order submission. */
export type OrderApproval = {
  approvalToken: string;
  approvedBy: string;
  approvedAt: string;
  approved: boolean;
};

export type Order = {
  orderId: OrderId;
  workspaceId: string;
  storeId: string;
  brandId: string;
  supplierPlatform: "CJ_DROPSHIPPING";
  connectorId: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    countryCode: string;
    phone: string;
  };
  estimatedCost: number;
  estimatedDeliveryDaysMin: number;
  estimatedDeliveryDaysMax: number;
  currency: string;
  approval: OrderApproval | null;
  supplierOrderId: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  trackingEvents: TrackingEvent[];
  integrationMode: "SANDBOX" | "LIVE";
  createdAt: string;
  updatedAt: string;
};

export type OrderCreateInput = Omit<Order, "orderId" | "createdAt" | "updatedAt">;

const isoTimestamp = z.string().datetime({ offset: true });

export const orderApprovalSchema = z.object({
  approvalToken: z.string().min(1),
  approvedBy: z.string().min(1),
  approvedAt: isoTimestamp,
  approved: z.literal(true),
});

export const orderSchema = z.object({
  orderId: z.string().min(1),
  workspaceId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  supplierPlatform: z.literal("CJ_DROPSHIPPING"),
  connectorId: z.string().min(1),
  status: orderStatusSchema,
  fulfillmentStatus: fulfillmentStatusSchema,
  items: z.array(orderItemSchema).min(1),
  shippingAddress: z.object({
    fullName: z.string().min(1),
    addressLine1: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    countryCode: z.string().length(2),
    phone: z.string().min(1),
  }),
  estimatedCost: z.number().min(0),
  estimatedDeliveryDaysMin: z.number().int().min(0),
  estimatedDeliveryDaysMax: z.number().int().min(0),
  currency: z.string().length(3),
  approval: orderApprovalSchema.nullable(),
  supplierOrderId: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  carrier: z.string().nullable(),
  trackingEvents: z.array(trackingEventSchema),
  integrationMode: z.enum(["SANDBOX", "LIVE"]),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an Order record shape. */
export function validateOrder(value: unknown): Order {
  return orderSchema.parse(value);
}

/** Returns true when an order has a valid approval gate for submission. */
export function isOrderApproved(order: Pick<Order, "approval" | "status">): boolean {
  return order.approval?.approved === true && order.status === "APPROVED";
}
