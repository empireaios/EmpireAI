import { z } from "zod";

export const AUDIT_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "PASS"] as const;

export type AuditSeverity = (typeof AUDIT_SEVERITIES)[number];

/** Generic audit dimension result. */
export type AuditDimensionResult = {
  dimensionId: string;
  dimensionName: string;
  severity: AuditSeverity;
  score: number;
  findings: string[];
  summary: string;
};

export const auditDimensionResultSchema = z.object({
  dimensionId: z.string().min(1),
  dimensionName: z.string().min(1),
  severity: z.enum(AUDIT_SEVERITIES),
  score: z.number().min(0).max(100),
  findings: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
});

/** Validates an AuditDimensionResult record shape. */
export function validateAuditDimensionResult(value: unknown): AuditDimensionResult {
  return auditDimensionResultSchema.parse(value);
}

export type ArchitectureAudit = AuditDimensionResult;
export type SecurityAudit = AuditDimensionResult;
export type ScalabilityAudit = AuditDimensionResult;
export type PerformanceAudit = AuditDimensionResult;
export type ReliabilityAudit = AuditDimensionResult;
export type BusinessReadinessAudit = AuditDimensionResult;
export type DeploymentReadinessAudit = AuditDimensionResult;
export type LaunchReadinessAudit = AuditDimensionResult;
