import { z } from "zod";

import {
  decisionExplainabilityReportSchema,
  type DecisionExplainabilityReport,
} from "./decision-explainability-report.js";

export type DecisionExplainabilityRecordId = string;

/** Persisted decision explainability intelligence record. */
export type DecisionExplainabilityRecord = DecisionExplainabilityReport & {
  recordId: DecisionExplainabilityRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type DecisionExplainabilityRecordCreateInput = Omit<
  DecisionExplainabilityRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const decisionExplainabilityRecordSchema = decisionExplainabilityReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a DecisionExplainabilityRecord record shape. */
export function validateDecisionExplainabilityRecord(
  value: unknown,
): DecisionExplainabilityRecord {
  return decisionExplainabilityRecordSchema.parse(value);
}
