import { z } from "zod";

import {
  continuousOptimizationReportSchema,
  type ContinuousOptimizationReport,
} from "./continuous-optimization-report.js";

export type ContinuousOptimizationRecordId = string;

/** Persisted continuous optimization intelligence record. */
export type ContinuousOptimizationRecord = ContinuousOptimizationReport & {
  recordId: ContinuousOptimizationRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type ContinuousOptimizationRecordCreateInput = Omit<
  ContinuousOptimizationRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const continuousOptimizationRecordSchema = continuousOptimizationReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ContinuousOptimizationRecord record shape. */
export function validateContinuousOptimizationRecord(
  value: unknown,
): ContinuousOptimizationRecord {
  return continuousOptimizationRecordSchema.parse(value);
}
