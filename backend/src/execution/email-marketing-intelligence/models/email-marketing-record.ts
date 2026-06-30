import { z } from "zod";

import {
  emailMarketingBlueprintSchema,
  type EmailMarketingBlueprint,
} from "./email-marketing-blueprint.js";

export type EmailMarketingRecordId = string;

/** Persisted email marketing intelligence record. */
export type EmailMarketingRecord = EmailMarketingBlueprint & {
  recordId: EmailMarketingRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type EmailMarketingRecordCreateInput = Omit<
  EmailMarketingRecord,
  "recordId" | "workspaceId" | "blueprintId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const emailMarketingRecordSchema = emailMarketingBlueprintSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an EmailMarketingRecord record shape. */
export function validateEmailMarketingRecord(value: unknown): EmailMarketingRecord {
  return emailMarketingRecordSchema.parse(value);
}
