import { z } from "zod";

import { auditDimensionResultSchema } from "./audit-dimension.js";
import { auditRecommendationSchema, type AuditRecommendation } from "./audit-recommendation.js";
import { criticalIssueSchema, type CriticalIssue } from "./critical-issue.js";
import { empireAuditSignalSchema, type EmpireAuditSignal } from "./empire-audit-signal.js";
import {
  empireReadinessScoreSchema,
  type EmpireReadinessScore,
} from "./empire-readiness-score.js";
import { nextMissionsRoadmapSchema, type NextMissionsRoadmap } from "./next-missions-roadmap.js";

export type EmpireAuditReportId = string;

/** Complete EmpireAI audit report — intelligence only, no auto-remediate. */
export type EmpireAuditReport = {
  reportId: EmpireAuditReportId;
  workspaceId: string;
  reportName: string;
  architecture: z.infer<typeof auditDimensionResultSchema>;
  security: z.infer<typeof auditDimensionResultSchema>;
  scalability: z.infer<typeof auditDimensionResultSchema>;
  performance: z.infer<typeof auditDimensionResultSchema>;
  reliability: z.infer<typeof auditDimensionResultSchema>;
  businessReadiness: z.infer<typeof auditDimensionResultSchema>;
  deploymentReadiness: z.infer<typeof auditDimensionResultSchema>;
  launchReadiness: z.infer<typeof auditDimensionResultSchema>;
  criticalIssues: CriticalIssue[];
  recommendations: AuditRecommendation[];
  empireReadinessScore: EmpireReadinessScore;
  nextMissions: NextMissionsRoadmap;
  overallScore: number;
  confidence: number;
  signals: EmpireAuditSignal[];
  intelligenceOnly: true;
  deploymentEnabled: false;
  autoRemediateEnabled: false;
};

export type EmpireAuditReportCreateInput = Omit<EmpireAuditReport, "reportId">;

export const empireAuditReportSchema = z.object({
  reportId: z.string().min(1),
  workspaceId: z.string().min(1),
  reportName: z.string().min(1),
  architecture: auditDimensionResultSchema,
  security: auditDimensionResultSchema,
  scalability: auditDimensionResultSchema,
  performance: auditDimensionResultSchema,
  reliability: auditDimensionResultSchema,
  businessReadiness: auditDimensionResultSchema,
  deploymentReadiness: auditDimensionResultSchema,
  launchReadiness: auditDimensionResultSchema,
  criticalIssues: z.array(criticalIssueSchema),
  recommendations: z.array(auditRecommendationSchema).min(1),
  empireReadinessScore: empireReadinessScoreSchema,
  nextMissions: nextMissionsRoadmapSchema,
  overallScore: z.number().min(0).max(100),
  confidence: z.number().min(0).max(100),
  signals: z.array(empireAuditSignalSchema),
  intelligenceOnly: z.literal(true),
  deploymentEnabled: z.literal(false),
  autoRemediateEnabled: z.literal(false),
});

/** Validates an EmpireAuditReport record shape. */
export function validateEmpireAuditReport(value: unknown): EmpireAuditReport {
  return empireAuditReportSchema.parse(value);
}
