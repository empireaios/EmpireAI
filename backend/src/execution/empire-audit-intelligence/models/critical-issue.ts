import { z } from "zod";

import { AUDIT_SEVERITIES, type AuditSeverity } from "./audit-dimension.js";

export const ISSUE_CATEGORIES = [
  "ARCHITECTURE",
  "SECURITY",
  "SCALABILITY",
  "PERFORMANCE",
  "RELIABILITY",
  "BUSINESS",
  "DEPLOYMENT",
  "LAUNCH",
] as const;

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number];

/** Critical issue identified during EmpireAI audit. */
export type CriticalIssue = {
  issueId: string;
  category: IssueCategory;
  severity: AuditSeverity;
  title: string;
  description: string;
  impact: string;
  remediation: string;
  score: number;
};

export const criticalIssueSchema = z.object({
  issueId: z.string().min(1),
  category: z.enum(ISSUE_CATEGORIES),
  severity: z.enum(AUDIT_SEVERITIES),
  title: z.string().min(1),
  description: z.string().min(1),
  impact: z.string().min(1),
  remediation: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a CriticalIssue record shape. */
export function validateCriticalIssue(value: unknown): CriticalIssue {
  return criticalIssueSchema.parse(value);
}
