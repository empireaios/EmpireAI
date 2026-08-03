import type { SeoContentWorkerConfiguration } from "./configuration.js";
import type { SeoContentReport, SeowInput } from "./types.js";

export function validateBoundaryInput(input: SeowInput): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (input.fabricateSeoPerformanceClaims) {
    errors.push("Boundary violation: never fabricate SEO performance claims");
  }
  if (input.publishArticles) {
    errors.push("Boundary violation: never publish articles");
  }
  if (input.manipulateSearchRankings) {
    errors.push("Boundary violation: never manipulate search rankings");
  }
  if (input.replaceAnalyticsWorker) {
    errors.push("Boundary violation: never replace Analytics Worker");
  }
  if (input.overrideApprovedArchitecture) {
    errors.push("Boundary violation: never override approved architecture");
  }
  if (input.overridePillow) {
    errors.push("Boundary violation: never override Pillow");
  }
  if (input.overrideGrandKing) {
    errors.push("Boundary violation: never override Grand King");
  }
  if (input.bypassGrandKingApproval) {
    errors.push("Boundary violation: never bypass Grand King approval");
  }
  if (input.implementQ806OrLater) {
    errors.push("Boundary violation: never implement Q8-06 or later");
  }
  const mission = input.missionId?.trim().toUpperCase() ?? "";
  if (mission.startsWith("Q8-") && mission !== "Q8-05") {
    const num = Number(mission.replace("Q8-", ""));
    if (Number.isFinite(num) && num >= 6) {
      errors.push(`Boundary violation: mission ${mission} is Q8-06 or later`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validateReportShape(report: SeoContentReport): string[] {
  const errors: string[] = [];
  const required: Array<keyof SeoContentReport> = [
    "reportId",
    "timestamp",
    "affiliateProjectId",
    "contentPlan",
    "targetKeywords",
    "searchIntent",
    "articleBrief",
    "seoArticle",
    "internalLinkingPlan",
    "contentQualitySummary",
    "auditStatus",
    "outstandingIssues",
    "confidenceScore",
    "metadataVersion",
  ];
  for (const key of required) {
    if (report[key] === undefined) errors.push(`Missing required field: ${key}`);
  }
  if (!report.consumableByQ806) errors.push("consumableByQ806 must be true");
  if (!report.neverFabricateSeoPerformanceClaims) {
    errors.push("neverFabricateSeoPerformanceClaims must be true");
  }
  if (report.seoArticle?.fabricated) errors.push("Fabricated SEO articles are forbidden");
  if (report.contentPlan?.fabricated) errors.push("Fabricated content plans are forbidden");
  return errors;
}

export function assertWorkerEnabled(config: SeoContentWorkerConfiguration) {
  if (!config.enabled) throw new Error("SEO Content Worker is disabled");
  if (!config.seoRulesEnabled) {
    throw new Error("SEO Content Worker SEO rules disabled");
  }
}
