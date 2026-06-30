import { z } from "zod";

import { customerJourneySchema, type CustomerJourney } from "./customer-journey.js";

export type CustomerJourneyRecordId = string;

/** Persisted customer journey intelligence record. */
export type CustomerJourneyRecord = CustomerJourney & {
  recordId: CustomerJourneyRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerJourneyRecordCreateInput = Omit<
  CustomerJourneyRecord,
  "recordId" | "workspaceId" | "journeyId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const customerJourneyRecordSchema = customerJourneySchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a CustomerJourneyRecord record shape. */
export function validateCustomerJourneyRecord(value: unknown): CustomerJourneyRecord {
  return customerJourneyRecordSchema.parse(value);
}
