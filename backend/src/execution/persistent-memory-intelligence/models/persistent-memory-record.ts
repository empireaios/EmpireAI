import { z } from "zod";

import {
  persistentMemoryReportSchema,
  type PersistentMemoryReport,
} from "./persistent-memory-report.js";

export type PersistentMemoryRecordId = string;

/** Persisted persistent memory intelligence record. */
export type PersistentMemoryRecord = PersistentMemoryReport & {
  recordId: PersistentMemoryRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type PersistentMemoryRecordCreateInput = Omit<
  PersistentMemoryRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const persistentMemoryRecordSchema = persistentMemoryReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a PersistentMemoryRecord record shape. */
export function validatePersistentMemoryRecord(value: unknown): PersistentMemoryRecord {
  return persistentMemoryRecordSchema.parse(value);
}
