import { z } from "zod";

import { croReportSchema, type CroReport } from "./cro-report.js";

export type CroIntelligenceRecordId = string;

/** Persisted CRO intelligence record. */
export type CroIntelligenceRecord = CroReport & {
  recordId: CroIntelligenceRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type CroIntelligenceRecordCreateInput = Omit<
  CroIntelligenceRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const croIntelligenceRecordSchema = croReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a CroIntelligenceRecord record shape. */
export function validateCroIntelligenceRecord(value: unknown): CroIntelligenceRecord {
  return croIntelligenceRecordSchema.parse(value);
}
