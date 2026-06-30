import { z } from "zod";

import {
  mobileMessagingBlueprintSchema,
  type MobileMessagingBlueprint,
} from "./mobile-messaging-blueprint.js";

export type MobileMessagingRecordId = string;

/** Persisted mobile messaging intelligence record. */
export type MobileMessagingRecord = MobileMessagingBlueprint & {
  recordId: MobileMessagingRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type MobileMessagingRecordCreateInput = Omit<
  MobileMessagingRecord,
  "recordId" | "workspaceId" | "blueprintId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const mobileMessagingRecordSchema = mobileMessagingBlueprintSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a MobileMessagingRecord record shape. */
export function validateMobileMessagingRecord(value: unknown): MobileMessagingRecord {
  return mobileMessagingRecordSchema.parse(value);
}
