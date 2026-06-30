import { z } from "zod";

export const CTD_CATEGORIES = [
  "purpose",
  "commercial",
  "intelligence",
  "recommendation",
  "honesty",
  "architecture",
  "module_contract",
  "self_awareness",
  "knowledge",
  "governance",
  "authority",
] as const;

export type CtdCategory = (typeof CTD_CATEGORIES)[number];

export const coreConstitutionArticleSchema = z.object({
  articleId: z.string().regex(/^CTD-\d{3}$/),
  sequence: z.number().int().min(1).max(40),
  title: z.string().min(1),
  statement: z.string().min(1),
  category: z.enum(CTD_CATEGORIES),
  immutable: z.literal(true),
  version: z.literal("1.0.0"),
  enforcementSurface: z.enum(["constitution", "doctrine", "governance", "architecture", "review", "backlog"]),
  relatedModules: z.array(z.string()).default([]),
});

export type CoreConstitutionArticle = z.infer<typeof coreConstitutionArticleSchema>;

export const constitutionComplianceCheckSchema = z.object({
  checkId: z.string(),
  articleId: z.string(),
  label: z.string(),
  status: z.enum(["COMPLIANT", "PARTIAL", "VIOLATION"]),
  evidence: z.string(),
  violation: z.string().nullable(),
});

export type ConstitutionComplianceCheck = z.infer<typeof constitutionComplianceCheckSchema>;

export const constitutionComplianceReportSchema = z.object({
  moduleId: z.literal("empire-constitution"),
  missionId: z.literal("CTD-001-040"),
  workspaceId: z.string(),
  companyId: z.string(),
  catalogVersion: z.literal("1.0.0"),
  articleCount: z.literal(40),
  articles: z.array(coreConstitutionArticleSchema),
  checks: z.array(constitutionComplianceCheckSchema),
  compliantCount: z.number(),
  partialCount: z.number(),
  violationCount: z.number(),
  coveragePercent: z.number(),
  doctrineCoverage: z.array(z.object({
    doctrineId: z.string(),
    title: z.string(),
    ctdArticles: z.array(z.string()),
  })),
  violations: z.array(z.string()),
  architectureComplete: z.literal(true),
  computedAt: z.string(),
});

export type ConstitutionComplianceReport = z.infer<typeof constitutionComplianceReportSchema>;

export const CORE_CONSTITUTION_VERSION = "1.0.0" as const;
export const CORE_CONSTITUTION_MISSION_ID = "CTD-001-040" as const;
