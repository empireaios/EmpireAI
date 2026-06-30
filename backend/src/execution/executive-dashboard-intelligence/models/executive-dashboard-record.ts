import { z } from "zod";

import {
  executiveDashboardReportSchema,
  type ExecutiveDashboardReport,
} from "./executive-dashboard-report.js";

export type ExecutiveDashboardRecordId = string;

/** Persisted executive dashboard intelligence record. */
export type ExecutiveDashboardRecord = ExecutiveDashboardReport & {
  recordId: ExecutiveDashboardRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type ExecutiveDashboardRecordCreateInput = Omit<
  ExecutiveDashboardRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const executiveDashboardRecordSchema = executiveDashboardReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an ExecutiveDashboardRecord record shape. */
export function validateExecutiveDashboardRecord(value: unknown): ExecutiveDashboardRecord {
  return executiveDashboardRecordSchema.parse(value);
}
