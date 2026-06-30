import { z } from "zod";

import type { Order } from "../../../orders/models/order.js";

export const PIPELINE_STATUSES = [
  "CHECKOUT_CREATED",
  "PAYMENT_PENDING",
  "PAYMENT_VERIFIED",
  "ORDER_CREATED",
  "INVENTORY_RESERVED",
  "AWAITING_FULFILLMENT_APPROVAL",
  "FULFILLMENT_REQUESTED",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

/** Unified customer order lifecycle record — checkout through delivery. */
export type CustomerOrderPipelineRecord = {
  pipelineId: string;
  workspaceId: string;
  companyId: string;
  storeId: string | null;
  brandId: string | null;
  paymentId: string | null;
  revenueOrderId: string | null;
  correlationId: string;
  status: PipelineStatus;
  customerEmail: string;
  customerName: string;
  revenueCents: number;
  currency: string;
  fulfillmentOrder: Order | null;
  inventoryReservationId: string | null;
  supplierOrderId: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  approvalToken: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  ledgerDeliveryEventId: string | null;
  mock: boolean;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const customerOrderPipelineRecordSchema = z.object({
  pipelineId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().nullable(),
  brandId: z.string().nullable(),
  paymentId: z.string().nullable(),
  revenueOrderId: z.string().nullable(),
  correlationId: z.string().min(1),
  status: z.enum(PIPELINE_STATUSES),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  revenueCents: z.number().int().min(0),
  currency: z.string().length(3),
  fulfillmentOrder: z.record(z.unknown()).nullable(),
  inventoryReservationId: z.string().nullable(),
  supplierOrderId: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  carrier: z.string().nullable(),
  approvalToken: z.string().nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: isoTimestamp.nullable(),
  ledgerDeliveryEventId: z.string().nullable(),
  mock: z.boolean(),
  metadata: z.record(z.string()),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

export function validateCustomerOrderPipelineRecord(
  value: unknown,
): CustomerOrderPipelineRecord {
  const parsed = customerOrderPipelineRecordSchema.parse(value);
  return {
    ...parsed,
    fulfillmentOrder: parsed.fulfillmentOrder as Order | null,
  };
}
