import { z } from "zod";

import {
  riskDetectionReportSchema,
  type RiskDetectionReport,
} from "./risk-detection-report.js";

export type RiskDetectionRecordId = string;

/** Persisted risk detection intelligence record. */
export type RiskDetectionRecord = RiskDetectionReport & {
  recordId: RiskDetectionRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type RiskDetectionRecordCreateInput = Omit<
  RiskDetectionRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const riskDetectionRecordSchema = riskDetectionReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a RiskDetectionRecord record shape. */
export function validateRiskDetectionRecord(value: unknown): RiskDetectionRecord {
  return riskDetectionRecordSchema.parse(value);
}
