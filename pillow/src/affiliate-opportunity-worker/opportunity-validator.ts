import type { AffiliateOpportunityWorkerConfiguration } from "./configuration.js";
import type { AffiliateOpportunityReport, AowInput } from "./types.js";

export function validateBoundaryInput(input: AowInput): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (input.fabricateCommissionOrDemandData) {
    errors.push("Boundary violation: never fabricate commission or demand data");
  }
  if (input.createAffiliateContent) {
    errors.push("Boundary violation: never create affiliate content");
  }
  if (input.publishWebsites) {
    errors.push("Boundary violation: never publish websites");
  }
  if (input.joinAffiliateProgrammesAutomatically) {
    errors.push("Boundary violation: never join affiliate programmes automatically");
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
  if (input.implementQ803OrLater) {
    errors.push("Boundary violation: never implement Q8-03 or later");
  }
  const mission = input.missionId?.trim().toUpperCase() ?? "";
  if (mission.startsWith("Q8-") && mission !== "Q8-02") {
    const num = Number(mission.replace("Q8-", ""));
    if (Number.isFinite(num) && num >= 3) {
      errors.push(`Boundary violation: mission ${mission} is Q8-03 or later`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validateReportShape(report: AffiliateOpportunityReport): string[] {
  const errors: string[] = [];
  const required: Array<keyof AffiliateOpportunityReport> = [
    "reportId",
    "timestamp",
    "affiliateProjectId",
    "programmeName",
    "productCategory",
    "targetNiche",
    "commissionStructure",
    "estimatedDemand",
    "competitionSummary",
    "opportunityScore",
    "risks",
    "recommendation",
    "auditStatus",
    "confidenceScore",
    "metadataVersion",
  ];
  for (const key of required) {
    if (report[key] === undefined) errors.push(`Missing required field: ${key}`);
  }
  if (!report.consumableByQ803) errors.push("consumableByQ803 must be true");
  if (!report.neverFabricateCommissionOrDemandData) {
    errors.push("neverFabricateCommissionOrDemandData must be true");
  }
  if (report.programmes.some((p) => p.fabricated)) {
    errors.push("Fabricated programmes are forbidden");
  }
  return errors;
}

export function assertWorkerEnabled(config: AffiliateOpportunityWorkerConfiguration) {
  if (!config.enabled) throw new Error("Affiliate Opportunity Worker is disabled");
  if (!config.opportunityRulesEnabled) {
    throw new Error("Affiliate Opportunity Worker opportunity rules disabled");
  }
}
