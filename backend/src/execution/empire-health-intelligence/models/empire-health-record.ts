import { z } from "zod";

import {
  empireHealthReportSchema,
  type EmpireHealthReport,
} from "./empire-health-report.js";

export type EmpireHealthRecordId = string;

/** Persisted empire health intelligence record. */
export type EmpireHealthRecord = EmpireHealthReport & {
  recordId: EmpireHealthRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type EmpireHealthRecordCreateInput = Omit<
  EmpireHealthRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const empireHealthRecordSchema = empireHealthReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an EmpireHealthRecord record shape. */
export function validateEmpireHealthRecord(value: unknown): EmpireHealthRecord {
  return empireHealthRecordSchema.parse(value);
}
