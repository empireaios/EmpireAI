import { z } from "zod";

export const CBD_CATEGORIES = [
  "purpose",
  "profit",
  "mindset",
  "ownership",
  "customer",
  "evaluation",
  "quality",
  "expansion",
  "lifecycle",
  "learning",
  "approval",
  "strategy",
  "success",
] as const;

export type CbdCategory = (typeof CBD_CATEGORIES)[number];

export const commercialIntegrityEntrySchema = z.object({
  ruleId: z.string(),
  domain: z.string(),
  rule: z.string(),
  status: z.enum(["COMPLIANT", "PARTIAL", "VIOLATION"]),
  cbdArticle: z.string(),
  evidence: z.string(),
});

export const commercialBusinessDoctrineArticleSchema = z.object({
  doctrineId: z.string().regex(/^CBD-\d{3}$/),
  sequence: z.number().int().min(1).max(20),
  title: z.string().min(1),
  statement: z.string().min(1),
  category: z.enum(CBD_CATEGORIES),
  boundModule: z.string().nullable(),
  immutable: z.literal(true),
  version: z.literal("1.0.0"),
});

export type CommercialBusinessDoctrineArticle = z.infer<typeof commercialBusinessDoctrineArticleSchema>;
export type CommercialIntegrityEntry = z.infer<typeof commercialIntegrityEntrySchema>;

export const commercialComplianceCheckSchema = z.object({
  checkId: z.string(),
  doctrineId: z.string(),
  label: z.string(),
  status: z.enum(["COMPLIANT", "PARTIAL", "VIOLATION"]),
  evidence: z.string(),
  violation: z.string().nullable(),
});

export const commercialComplianceReportSchema = z.object({
  moduleId: z.literal("empire-commercial-business-doctrine"),
  missionId: z.literal("CBD-001-020"),
  workspaceId: z.string(),
  companyId: z.string(),
  catalogVersion: z.literal("1.0.0"),
  doctrineCount: z.literal(20),
  doctrines: z.array(commercialBusinessDoctrineArticleSchema),
  businessRuleCoverage: z.array(z.string()),
  commercialIntegrityReview: z.array(commercialIntegrityEntrySchema),
  checks: z.array(commercialComplianceCheckSchema),
  compliantCount: z.number(),
  partialCount: z.number(),
  violationCount: z.number(),
  coveragePercent: z.number(),
  reviewPassed: z.boolean(),
  violations: z.array(z.string()),
  architectureComplete: z.literal(true),
  computedAt: z.string(),
});

export type CommercialComplianceCheck = z.infer<typeof commercialComplianceCheckSchema>;
export type CommercialComplianceReport = z.infer<typeof commercialComplianceReportSchema>;

export const COMMERCIAL_BUSINESS_DOCTRINE_VERSION = "1.0.0" as const;
export const COMMERCIAL_BUSINESS_DOCTRINE_MISSION_ID = "CBD-001-020" as const;
