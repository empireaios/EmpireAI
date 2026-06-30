import { z } from "zod";

import {
  financialForecastReportSchema,
  type FinancialForecastReport,
} from "./financial-forecast-report.js";

export type FinancialForecastRecordId = string;

/** Persisted financial forecast intelligence record. */
export type FinancialForecastRecord = FinancialForecastReport & {
  recordId: FinancialForecastRecordId;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type FinancialForecastRecordCreateInput = Omit<
  FinancialForecastRecord,
  "recordId" | "workspaceId" | "reportId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const financialForecastRecordSchema = financialForecastReportSchema.extend({
  recordId: z.string().min(1),
  workspaceId: z.string().min(1),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates a FinancialForecastRecord record shape. */
export function validateFinancialForecastRecord(value: unknown): FinancialForecastRecord {
  return financialForecastRecordSchema.parse(value);
}
