import { z } from "zod";

export const UID_CATEGORIES = [
  "identity",
  "dashboard",
  "navigation",
  "executive_ux",
  "visual_hierarchy",
  "simplicity",
  "success_mission",
  "review",
] as const;

export type UidCategory = (typeof UID_CATEGORIES)[number];

export const navigationReviewEntrySchema = z.object({
  routeId: z.string(),
  path: z.string(),
  label: z.string(),
  role: z.string(),
  purpose: z.string(),
  uidArticles: z.array(z.string()),
  status: z.enum(["COMPLIANT", "PARTIAL", "VIOLATION"]),
});

export const uxIdentityDoctrineArticleSchema = z.object({
  doctrineId: z.string().regex(/^UID-\d{3}$/),
  sequence: z.number().int().min(1).max(20),
  title: z.string().min(1),
  statement: z.string().min(1),
  category: z.enum(UID_CATEGORIES),
  boundSurface: z.string().nullable(),
  immutable: z.literal(true),
  version: z.literal("1.0.0"),
});

export type UxIdentityDoctrineArticle = z.infer<typeof uxIdentityDoctrineArticleSchema>;
export type NavigationReviewEntry = z.infer<typeof navigationReviewEntrySchema>;

export const uxIdentityComplianceCheckSchema = z.object({
  checkId: z.string(),
  doctrineId: z.string(),
  label: z.string(),
  status: z.enum(["COMPLIANT", "PARTIAL", "VIOLATION"]),
  evidence: z.string(),
  violation: z.string().nullable(),
});

export const uxIdentityComplianceReportSchema = z.object({
  moduleId: z.literal("empire-ux-identity-doctrine"),
  missionId: z.literal("UID-001-020"),
  workspaceId: z.string(),
  companyId: z.string(),
  catalogVersion: z.literal("1.0.0"),
  doctrineCount: z.literal(20),
  doctrines: z.array(uxIdentityDoctrineArticleSchema),
  identityCoverage: z.array(z.string()),
  uxCoverage: z.array(z.string()),
  navigationReview: z.array(navigationReviewEntrySchema),
  checks: z.array(uxIdentityComplianceCheckSchema),
  compliantCount: z.number(),
  partialCount: z.number(),
  violationCount: z.number(),
  coveragePercent: z.number(),
  reviewPassed: z.boolean(),
  violations: z.array(z.string()),
  architectureComplete: z.literal(true),
  computedAt: z.string(),
});

export type UxIdentityComplianceCheck = z.infer<typeof uxIdentityComplianceCheckSchema>;
export type UxIdentityComplianceReport = z.infer<typeof uxIdentityComplianceReportSchema>;

export const UX_IDENTITY_DOCTRINE_VERSION = "1.0.0" as const;
export const UX_IDENTITY_DOCTRINE_MISSION_ID = "UID-001-020" as const;
