import { z } from "zod";

import { adCreativePackageSchema, type AdCreativePackage } from "./ad-creative-package.js";

export type AdCreativeRecordId = string;

/** Persisted ad creative generation record. */
export type AdCreativeRecord = AdCreativePackage & {
  recordId: AdCreativeRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type AdCreativeRecordCreateInput = Omit<
  AdCreativeRecord,
  "recordId" | "workspaceId" | "packageId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const adCreativeRecordSchema = adCreativePackageSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an AdCreativeRecord record shape. */
export function validateAdCreativeRecord(value: unknown): AdCreativeRecord {
  return adCreativeRecordSchema.parse(value);
}
