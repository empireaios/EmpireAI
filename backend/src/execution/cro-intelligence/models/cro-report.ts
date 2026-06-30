import { z } from "zod";

import { croAreaAnalysisSchema, type CroAreaAnalysis } from "./cro-area-analysis.js";
import {
  croPriorityImprovementSchema,
  type CroPriorityImprovement,
} from "./cro-priority-improvement.js";
import { croSignalSchema, type CroSignal } from "./cro-signal.js";

export type CroReportId = string;

/** Complete CRO recommendations report — intelligence only, no deployment. */
export type CroReport = {
  reportId: CroReportId;
  storeId: string;
  brandId: string;
  reportName: string;
  analyses: CroAreaAnalysis[];
  priorityImprovements: CroPriorityImprovement[];
  overallScore: number;
  aggregateExpectedLiftMin: number;
  aggregateExpectedLiftMax: number;
  confidence: number;
  signals: CroSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoApplyEnabled: false;
};

export type CroReportCreateInput = Omit<CroReport, "reportId">;

export const croReportSchema = z.object({
  reportId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  reportName: z.string().min(1),
  analyses: z.array(croAreaAnalysisSchema).length(8),
  priorityImprovements: z.array(croPriorityImprovementSchema).min(1),
  overallScore: z.number().min(0).max(100),
  aggregateExpectedLiftMin: z.number().min(0).max(100),
  aggregateExpectedLiftMax: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(croSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoApplyEnabled: z.literal(false),
});

/** Validates a CroReport record shape. */
export function validateCroReport(value: unknown): CroReport {
  return croReportSchema.parse(value);
}
