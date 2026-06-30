import { z } from "zod";

export const ACD_CATEGORIES = [
  "modularity",
  "contracts",
  "dependencies",
  "runtime_surface",
  "shared_intelligence",
  "ownership",
  "extensibility",
  "adapters",
  "review",
] as const;

export type AcdCategory = (typeof ACD_CATEGORIES)[number];

export const dependencyReviewEntrySchema = z.object({
  edgeId: z.string(),
  fromModule: z.string(),
  toModule: z.string(),
  relationship: z.string(),
  status: z.enum(["EXPLICIT", "ADAPTER", "COMPLIANT", "VIOLATION"]),
  acdArticle: z.string(),
  note: z.string(),
});

export const architectureConstraintArticleSchema = z.object({
  constraintId: z.string().regex(/^ACD-\d{3}$/),
  sequence: z.number().int().min(1).max(30),
  title: z.string().min(1),
  statement: z.string().min(1),
  category: z.enum(ACD_CATEGORIES),
  boundModule: z.string().nullable(),
  immutable: z.literal(true),
  version: z.literal("1.0.0"),
});

export type ArchitectureConstraintArticle = z.infer<typeof architectureConstraintArticleSchema>;
export type DependencyReviewEntry = z.infer<typeof dependencyReviewEntrySchema>;

export const architectureComplianceCheckSchema = z.object({
  checkId: z.string(),
  constraintId: z.string(),
  label: z.string(),
  status: z.enum(["COMPLIANT", "PARTIAL", "VIOLATION"]),
  evidence: z.string(),
  violation: z.string().nullable(),
});

export const architectureComplianceReportSchema = z.object({
  moduleId: z.literal("empire-architecture-constraints"),
  missionId: z.literal("ACD-001-030"),
  workspaceId: z.string(),
  companyId: z.string(),
  catalogVersion: z.literal("1.0.0"),
  constraintCount: z.literal(30),
  constraints: z.array(architectureConstraintArticleSchema),
  dependencyReview: z.array(dependencyReviewEntrySchema),
  checks: z.array(architectureComplianceCheckSchema),
  compliantCount: z.number(),
  partialCount: z.number(),
  violationCount: z.number(),
  coveragePercent: z.number(),
  reviewPassed: z.boolean(),
  violations: z.array(z.string()),
  architectureComplete: z.literal(true),
  computedAt: z.string(),
});

export type ArchitectureComplianceCheck = z.infer<typeof architectureComplianceCheckSchema>;
export type ArchitectureComplianceReport = z.infer<typeof architectureComplianceReportSchema>;

export const ARCHITECTURE_CONSTRAINT_VERSION = "1.0.0" as const;
export const ARCHITECTURE_CONSTRAINT_MISSION_ID = "ACD-001-030" as const;
