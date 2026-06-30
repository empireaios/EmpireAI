import { z } from "zod";

import {
  engineCoordinationReportSchema,
  type EngineCoordinationReport,
} from "./engine-coordination-report.js";

export type EngineCoordinationRecordId = string;

/** Persisted engine coordination intelligence record. */
export type EngineCoordinationRecord = EngineCoordinationReport & {
  recordId: EngineCoordinationRecordId;
  createdAt: string;
  updatedAt: string;
};

export type EngineCoordinationRecordCreateInput = Omit<
  EngineCoordinationRecord,
  "recordId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const engineCoordinationRecordSchema = engineCoordinationReportSchema.extend({
  recordId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an EngineCoordinationRecord record shape. */
export function validateEngineCoordinationRecord(value: unknown): EngineCoordinationRecord {
  return engineCoordinationRecordSchema.parse(value);
}
