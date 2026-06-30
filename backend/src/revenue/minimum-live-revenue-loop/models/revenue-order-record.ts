import { z } from "zod";

import type { Order } from "../../../orders/models/order.js";

export const REVENUE_ORDER_STATUSES = [
  "CHECKOUT_CREATED",
  "PAYMENT_RECEIVED",
  "AWAITING_FULFILLMENT_APPROVAL",
  "APPROVED",
  "FULFILLED",
  "PROFITABLE",
  "UNPROFITABLE",
  "FAILED",
] as const;

export type RevenueOrderStatus = (typeof REVENUE_ORDER_STATUSES)[number];

export type RevenueOrderRecord = {
  recordId: string;
  storeId: string;
  workspaceId: string;
  companyId: string;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  customerEmail: string;
  customerName: string;
  revenueCents: number;
  costCents: number;
  profitCents: number;
  currency: string;
  status: RevenueOrderStatus;
  fulfillmentOrder: Order | null;
  approvalToken: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  supplierOrderId: string | null;
  trackingNumber: string | null;
  profitable: boolean;
  createdAt: string;
  updatedAt: string;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const revenueOrderRecordSchema = z.object({
  recordId: z.string().min(1),
  storeId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  stripeSessionId: z.string().nullable(),
  stripePaymentIntentId: z.string().nullable(),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  revenueCents: z.number().int().min(0),
  costCents: z.number().int().min(0),
  profitCents: z.number().int(),
  currency: z.string().length(3),
  status: z.enum(REVENUE_ORDER_STATUSES),
  fulfillmentOrder: z.record(z.unknown()).nullable(),
  approvalToken: z.string().nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: isoTimestamp.nullable(),
  supplierOrderId: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  profitable: z.boolean(),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

export function validateRevenueOrderRecord(value: unknown): RevenueOrderRecord {
  const parsed = revenueOrderRecordSchema.parse(value);
  return {
    ...parsed,
    fulfillmentOrder: parsed.fulfillmentOrder as Order | null,
  };
}
