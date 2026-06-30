import { z } from "zod";

import { analyticsBlueprintSchema, type AnalyticsBlueprint } from "./analytics-blueprint.js";

export type AnalyticsIntelligenceRecordId = string;

/** Persisted analytics intelligence record. */
export type AnalyticsIntelligenceRecord = AnalyticsBlueprint & {
  recordId: AnalyticsIntelligenceRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type AnalyticsIntelligenceRecordCreateInput = Omit<
  AnalyticsIntelligenceRecord,
  "recordId" | "workspaceId" | "blueprintId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const analyticsIntelligenceRecordSchema = analyticsBlueprintSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an AnalyticsIntelligenceRecord record shape. */
export function validateAnalyticsIntelligenceRecord(
  value: unknown,
): AnalyticsIntelligenceRecord {
  return analyticsIntelligenceRecordSchema.parse(value);
}
