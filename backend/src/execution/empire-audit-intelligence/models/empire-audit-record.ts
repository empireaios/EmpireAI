import { z } from "zod";

import { empireAuditReportSchema, type EmpireAuditReport } from "./empire-audit-report.js";

export type EmpireAuditRecordId = string;

/** Persisted empire audit intelligence record. */
export type EmpireAuditRecord = EmpireAuditReport & {
  recordId: EmpireAuditRecordId;
  createdAt: string;
  updatedAt: string;
};

export type EmpireAuditRecordCreateInput = Omit<
  EmpireAuditRecord,
  "recordId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const empireAuditRecordSchema = empireAuditReportSchema.extend({
  recordId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an EmpireAuditRecord record shape. */
export function validateEmpireAuditRecord(value: unknown): EmpireAuditRecord {
  return empireAuditRecordSchema.parse(value);
}
