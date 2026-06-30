import { z } from "zod";

import {
  competitorIntelligenceReportSchema,
  type CompetitorIntelligenceReport,
} from "./competitor-intelligence-report.js";

export type CompetitorIntelligenceRecordId = string;

/** Persisted competitor intelligence record. */
export type CompetitorIntelligenceRecord = CompetitorIntelligenceReport & {
  recordId: CompetitorIntelligenceRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type CompetitorIntelligenceRecordCreateInput = Omit<
  CompetitorIntelligenceRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const competitorIntelligenceRecordSchema = competitorIntelligenceReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a CompetitorIntelligenceRecord record shape. */
export function validateCompetitorIntelligenceRecord(
  value: unknown,
): CompetitorIntelligenceRecord {
  return competitorIntelligenceRecordSchema.parse(value);
}
