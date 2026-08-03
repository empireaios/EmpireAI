import type { ComparisonSiteWorkerConfiguration } from "./configuration.js";
import type { ComparisonSiteReport, CswInput } from "./types.js";

export function validateBoundaryInput(input: CswInput): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (input.fabricateRankingsOrProductInformation) {
    errors.push("Boundary violation: never fabricate rankings or product information");
  }
  if (input.publishWebsites) {
    errors.push("Boundary violation: never publish websites");
  }
  if (input.manipulateRankingsWithoutEvidence) {
    errors.push("Boundary violation: never manipulate rankings without evidence");
  }
  if (input.replaceReviewContentWorker) {
    errors.push("Boundary violation: never replace Review Content Worker");
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
  if (input.implementQ804OrLater) {
    errors.push("Boundary violation: never implement Q8-04 or later");
  }
  const mission = input.missionId?.trim().toUpperCase() ?? "";
  if (mission.startsWith("Q8-") && mission !== "Q8-03") {
    const num = Number(mission.replace("Q8-", ""));
    if (Number.isFinite(num) && num >= 4) {
      errors.push(`Boundary violation: mission ${mission} is Q8-04 or later`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validateReportShape(report: ComparisonSiteReport): string[] {
  const errors: string[] = [];
  const required: Array<keyof ComparisonSiteReport> = [
    "reportId",
    "timestamp",
    "affiliateProjectId",
    "comparisonTopic",
    "productsCompared",
    "rankingResults",
    "comparisonTables",
    "buyerGuide",
    "methodologySummary",
    "supportingEvidence",
    "auditStatus",
    "outstandingIssues",
    "confidenceScore",
    "metadataVersion",
  ];
  for (const key of required) {
    if (report[key] === undefined) errors.push(`Missing required field: ${key}`);
  }
  if (!report.consumableByQ804) errors.push("consumableByQ804 must be true");
  if (!report.neverFabricateRankingsOrProductInformation) {
    errors.push("neverFabricateRankingsOrProductInformation must be true");
  }
  if (report.rankingResults.some((r) => r.fabricated)) {
    errors.push("Fabricated rankings are forbidden");
  }
  return errors;
}

export function assertWorkerEnabled(config: ComparisonSiteWorkerConfiguration) {
  if (!config.enabled) throw new Error("Comparison Site Worker is disabled");
  if (!config.comparisonRulesEnabled) {
    throw new Error("Comparison Site Worker comparison rules disabled");
  }
}
