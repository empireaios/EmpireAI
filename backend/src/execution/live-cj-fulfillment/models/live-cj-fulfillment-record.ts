import { z } from "zod";

import type { Order } from "../../../orders/models/order.js";

export const LIVE_CJ_FULFILLMENT_STATUSES = [
  "PENDING_FOUNDER_APPROVAL",
  "APPROVED",
  "SUBMITTING",
  "SUBMITTED",
  "TRACKING_SYNCED",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "RECOVERABLE",
] as const;

export type LiveCjFulfillmentStatus = (typeof LIVE_CJ_FULFILLMENT_STATUSES)[number];

/** LIVE CJ fulfillment job — founder-gated, never auto-submitted. */
export type LiveCjFulfillmentRecord = {
  fulfillmentId: string;
  pipelineId: string;
  workspaceId: string;
  companyId: string;
  status: LiveCjFulfillmentStatus;
  integrationMode: "LIVE" | "MOCK_LIVE";
  fulfillmentOrder: Order;
  supplierOrderId: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  founderApprovalToken: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  attemptCount: number;
  lastErrorMessage: string | null;
  lastTrackingSyncAt: string | null;
  mock: boolean;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

const isoTimestamp = z.string().datetime({ offset: true });

export const liveCjFulfillmentRecordSchema = z.object({
  fulfillmentId: z.string().min(1),
  pipelineId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  status: z.enum(LIVE_CJ_FULFILLMENT_STATUSES),
  integrationMode: z.enum(["LIVE", "MOCK_LIVE"]),
  fulfillmentOrder: z.record(z.unknown()),
  supplierOrderId: z.string().nullable(),
  trackingNumber: z.string().nullable(),
  carrier: z.string().nullable(),
  founderApprovalToken: z.string().nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: isoTimestamp.nullable(),
  attemptCount: z.number().int().min(0),
  lastErrorMessage: z.string().nullable(),
  lastTrackingSyncAt: isoTimestamp.nullable(),
  mock: z.boolean(),
  metadata: z.record(z.string()),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

export function validateLiveCjFulfillmentRecord(value: unknown): LiveCjFulfillmentRecord {
  const parsed = liveCjFulfillmentRecordSchema.parse(value);
  return {
    ...parsed,
    fulfillmentOrder: parsed.fulfillmentOrder as Order,
  };
}

export const FULFILLMENT_ATTEMPT_PHASES = ["submit", "tracking", "recovery"] as const;
export type FulfillmentAttemptPhase = (typeof FULFILLMENT_ATTEMPT_PHASES)[number];

export const FULFILLMENT_ATTEMPT_OUTCOMES = ["success", "failed"] as const;
export type FulfillmentAttemptOutcome = (typeof FULFILLMENT_ATTEMPT_OUTCOMES)[number];

export type FulfillmentAttemptRecord = {
  attemptId: string;
  fulfillmentId: string;
  attemptNumber: number;
  phase: FulfillmentAttemptPhase;
  outcome: FulfillmentAttemptOutcome;
  message: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export const fulfillmentAttemptRecordSchema = z.object({
  attemptId: z.string().min(1),
  fulfillmentId: z.string().min(1),
  attemptNumber: z.number().int().min(1),
  phase: z.enum(FULFILLMENT_ATTEMPT_PHASES),
  outcome: z.enum(FULFILLMENT_ATTEMPT_OUTCOMES),
  message: z.string(),
  metadata: z.record(z.string()),
  createdAt: z.string().datetime({ offset: true }),
});

export function validateFulfillmentAttemptRecord(value: unknown): FulfillmentAttemptRecord {
  return fulfillmentAttemptRecordSchema.parse(value);
}
