import { z } from "zod";

export const GVD_CATEGORIES = [
  "authority",
  "module_boundary",
  "recommendation",
  "approval",
  "audit",
  "versioning",
  "boundaries",
  "escalation",
  "review",
] as const;

export type GvdCategory = (typeof GVD_CATEGORIES)[number];

export const authorityMatrixEntrySchema = z.object({
  moduleId: z.string(),
  role: z.string(),
  mayExecute: z.boolean(),
  mayDecide: z.boolean(),
  mayRecommend: z.boolean(),
  escalationTarget: z.string().nullable(),
  gvdArticles: z.array(z.string()),
});

export const governanceDoctrineArticleSchema = z.object({
  doctrineId: z.string().regex(/^GVD-\d{3}$/),
  sequence: z.number().int().min(1).max(30),
  title: z.string().min(1),
  statement: z.string().min(1),
  category: z.enum(GVD_CATEGORIES),
  boundModule: z.string().nullable(),
  immutable: z.literal(true),
  version: z.literal("1.0.0"),
});

export type GovernanceDoctrineArticle = z.infer<typeof governanceDoctrineArticleSchema>;
export type AuthorityMatrixEntry = z.infer<typeof authorityMatrixEntrySchema>;

export const governanceComplianceCheckSchema = z.object({
  checkId: z.string(),
  doctrineId: z.string(),
  label: z.string(),
  status: z.enum(["COMPLIANT", "PARTIAL", "VIOLATION"]),
  evidence: z.string(),
  violation: z.string().nullable(),
});

export const governanceComplianceReportSchema = z.object({
  moduleId: z.literal("empire-governance-doctrine"),
  missionId: z.literal("GVD-001-030"),
  workspaceId: z.string(),
  companyId: z.string(),
  catalogVersion: z.literal("1.0.0"),
  doctrineCount: z.literal(30),
  doctrines: z.array(governanceDoctrineArticleSchema),
  authorityMatrix: z.array(authorityMatrixEntrySchema),
  checks: z.array(governanceComplianceCheckSchema),
  compliantCount: z.number(),
  partialCount: z.number(),
  violationCount: z.number(),
  coveragePercent: z.number(),
  reviewPassed: z.boolean(),
  violations: z.array(z.string()),
  architectureComplete: z.literal(true),
  computedAt: z.string(),
});

export type GovernanceComplianceCheck = z.infer<typeof governanceComplianceCheckSchema>;
export type GovernanceComplianceReport = z.infer<typeof governanceComplianceReportSchema>;

export const GOVERNANCE_DOCTRINE_VERSION = "1.0.0" as const;
export const GOVERNANCE_DOCTRINE_MISSION_ID = "GVD-001-030" as const;
