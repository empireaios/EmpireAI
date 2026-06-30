import { z } from "zod";

import {
  reviewIntelligenceReportSchema,
  type ReviewIntelligenceReport,
} from "./review-intelligence-report.js";

export type ReviewIntelligenceRecordId = string;

/** Persisted review intelligence record. */
export type ReviewIntelligenceRecord = ReviewIntelligenceReport & {
  recordId: ReviewIntelligenceRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewIntelligenceRecordCreateInput = Omit<
  ReviewIntelligenceRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const reviewIntelligenceRecordSchema = reviewIntelligenceReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a ReviewIntelligenceRecord record shape. */
export function validateReviewIntelligenceRecord(value: unknown): ReviewIntelligenceRecord {
  return reviewIntelligenceRecordSchema.parse(value);
}
