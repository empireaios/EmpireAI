import { z } from "zod";

import { contentLibrarySchema, type ContentLibrary } from "./content-library.js";

export type ContentLibraryRecordId = string;

/** Persisted content library intelligence record. */
export type ContentLibraryRecord = ContentLibrary & {
  recordId: ContentLibraryRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type ContentLibraryRecordCreateInput = Omit<
  ContentLibraryRecord,
  "recordId" | "workspaceId" | "libraryId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const contentLibraryRecordSchema = contentLibrarySchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ContentLibraryRecord record shape. */
export function validateContentLibraryRecord(value: unknown): ContentLibraryRecord {
  return contentLibraryRecordSchema.parse(value);
}
