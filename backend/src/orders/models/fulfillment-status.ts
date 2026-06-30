import { z } from "zod";

export const FULFILLMENT_STATUSES = [
  "PENDING",
  "PREPARING",
  "SUBMITTED",
  "IN_TRANSIT",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export const fulfillmentStatusSchema = z.enum(FULFILLMENT_STATUSES);

/** Validates a fulfillment status value. */
export function validateFulfillmentStatus(value: unknown): FulfillmentStatus {
  return fulfillmentStatusSchema.parse(value);
}
