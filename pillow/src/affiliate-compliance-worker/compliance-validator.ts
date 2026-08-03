import type { AffiliateComplianceWorkerConfiguration } from "./configuration.js";
import type { AcwInput, AffiliateComplianceReport } from "./types.js";

export function validateBoundaryInput(input: AcwInput): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (input.fabricateComplianceResults) {
    errors.push("Boundary violation: never fabricate compliance results");
  }
  if (input.provideUnverifiedLegalConclusions) {
    errors.push("Boundary violation: never provide unverified legal conclusions");
  }
  if (input.publishAffiliateContent) {
    errors.push("Boundary violation: never publish affiliate content");
  }
  if (input.replaceLegalProfessionals) {
    errors.push("Boundary violation: never replace legal professionals");
  }
  if (input.overrideProgrammeRequirements) {
    errors.push("Boundary violation: never override programme requirements");
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
  if (input.implementQ809OrLater) {
    errors.push("Boundary violation: never implement Q8-09 or later");
  }
  const mission = input.missionId?.trim().toUpperCase() ?? "";
  if (mission.startsWith("Q8-") && mission !== "Q8-08") {
    const num = Number(mission.replace("Q8-", ""));
    if (Number.isFinite(num) && num >= 9) {
      errors.push(`Boundary violation: mission ${mission} is Q8-09 or later`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validateReportShape(report: AffiliateComplianceReport): string[] {
  const errors: string[] = [];
  const required: Array<keyof AffiliateComplianceReport> = [
    "reportId",
    "timestamp",
    "affiliateProjectId",
    "complianceScope",
    "disclosureValidation",
    "platformRuleValidation",
    "policyFindings",
    "complianceRisks",
    "recommendedCorrections",
    "readinessStatus",
    "auditStatus",
    "outstandingIssues",
    "confidenceScore",
    "metadataVersion",
  ];
  for (const key of required) {
    if (report[key] === undefined) errors.push(`Missing required field: ${key}`);
  }
  if (!report.consumableByQ809) errors.push("consumableByQ809 must be true");
  if (!report.neverFabricateComplianceResults) {
    errors.push("neverFabricateComplianceResults must be true");
  }
  if (report.legalConclusion !== "not_legal_advice") {
    errors.push("legalConclusion must remain not_legal_advice");
  }
  if (report.disclosureValidation?.fabricated) {
    errors.push("Fabricated disclosure validation is forbidden");
  }
  if (report.readinessAssessment?.autoApproved) {
    errors.push("Automatic approval of assets is forbidden");
  }
  return errors;
}

export function assertWorkerEnabled(config: AffiliateComplianceWorkerConfiguration) {
  if (!config.enabled) throw new Error("Affiliate Compliance Worker is disabled");
  if (!config.complianceRulesEnabled) {
    throw new Error("Affiliate Compliance Worker compliance rules disabled");
  }
}
