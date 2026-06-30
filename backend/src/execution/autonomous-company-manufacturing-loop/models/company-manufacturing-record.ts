import { z } from "zod";

import {
  companyManufacturingRunSchema,
  type CompanyManufacturingRun,
} from "./company-manufacturing-run.js";

export type CompanyManufacturingRecordId = string;

/** Persisted autonomous company manufacturing loop record. */
export type CompanyManufacturingRecord = CompanyManufacturingRun & {
  recordId: CompanyManufacturingRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyManufacturingRecordCreateInput = Omit<
  CompanyManufacturingRecord,
  "recordId" | "workspaceId" | "runId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const companyManufacturingRecordSchema = companyManufacturingRunSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a CompanyManufacturingRecord record shape. */
export function validateCompanyManufacturingRecord(
  value: unknown,
): CompanyManufacturingRecord {
  return companyManufacturingRecordSchema.parse(value);
}
