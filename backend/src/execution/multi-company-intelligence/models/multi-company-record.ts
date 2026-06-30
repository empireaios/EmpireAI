import { z } from "zod";

import {
  multiCompanyReportSchema,
  type MultiCompanyReport,
} from "./multi-company-report.js";

export type MultiCompanyRecordId = string;

/** Persisted multi-company intelligence record. */
export type MultiCompanyRecord = MultiCompanyReport & {
  recordId: MultiCompanyRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type MultiCompanyRecordCreateInput = Omit<
  MultiCompanyRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const multiCompanyRecordSchema = multiCompanyReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a MultiCompanyRecord record shape. */
export function validateMultiCompanyRecord(value: unknown): MultiCompanyRecord {
  return multiCompanyRecordSchema.parse(value);
}
