import type { ReviewContentWorkerConfiguration } from "./configuration.js";
import type { ReviewContentReport, RcwInput } from "./types.js";

export function validateBoundaryInput(input: RcwInput): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (input.fabricateReviewsRatingsOrProductInformation) {
    errors.push("Boundary violation: never fabricate reviews, ratings or product information");
  }
  if (input.publishWebsites) {
    errors.push("Boundary violation: never publish websites");
  }
  if (input.manipulateRatings) {
    errors.push("Boundary violation: never manipulate ratings");
  }
  if (input.replaceComparisonSiteWorker) {
    errors.push("Boundary violation: never replace Comparison Site Worker");
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
  if (input.implementQ805OrLater) {
    errors.push("Boundary violation: never implement Q8-05 or later");
  }
  const mission = input.missionId?.trim().toUpperCase() ?? "";
  if (mission.startsWith("Q8-") && mission !== "Q8-04") {
    const num = Number(mission.replace("Q8-", ""));
    if (Number.isFinite(num) && num >= 5) {
      errors.push(`Boundary violation: mission ${mission} is Q8-05 or later`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validateReportShape(report: ReviewContentReport): string[] {
  const errors: string[] = [];
  const required: Array<keyof ReviewContentReport> = [
    "reportId",
    "timestamp",
    "affiliateProjectId",
    "productOrServiceReviewed",
    "reviewSummary",
    "pros",
    "cons",
    "alternatives",
    "buyingRecommendation",
    "supportingEvidence",
    "auditStatus",
    "outstandingIssues",
    "confidenceScore",
    "metadataVersion",
  ];
  for (const key of required) {
    if (report[key] === undefined) errors.push(`Missing required field: ${key}`);
  }
  if (!report.consumableByQ805) errors.push("consumableByQ805 must be true");
  if (!report.neverFabricateReviewsRatingsOrProductInformation) {
    errors.push("neverFabricateReviewsRatingsOrProductInformation must be true");
  }
  if (report.reviewArticle?.fabricated) errors.push("Fabricated review articles are forbidden");
  if (report.buyingRecommendation?.fabricated) {
    errors.push("Fabricated buying recommendations are forbidden");
  }
  return errors;
}

export function assertWorkerEnabled(config: ReviewContentWorkerConfiguration) {
  if (!config.enabled) throw new Error("Review Content Worker is disabled");
  if (!config.reviewRulesEnabled) {
    throw new Error("Review Content Worker review rules disabled");
  }
}
