import type { EmailFunnelWorkerConfiguration } from "./configuration.js";
import type { EfwInput, EmailFunnelReport } from "./types.js";

export function validateBoundaryInput(input: EfwInput): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (input.fabricateConversionOrPerformanceClaims) {
    errors.push("Boundary violation: never fabricate conversion or performance claims");
  }
  if (input.sendLiveMarketingEmails) {
    errors.push("Boundary violation: never send live marketing emails");
  }
  if (input.manageEmailInfrastructure) {
    errors.push("Boundary violation: never manage email infrastructure");
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
  if (input.implementQ807OrLater) {
    errors.push("Boundary violation: never implement Q8-07 or later");
  }
  const mission = input.missionId?.trim().toUpperCase() ?? "";
  if (mission.startsWith("Q8-") && mission !== "Q8-06") {
    const num = Number(mission.replace("Q8-", ""));
    if (Number.isFinite(num) && num >= 7) {
      errors.push(`Boundary violation: mission ${mission} is Q8-07 or later`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validateReportShape(report: EmailFunnelReport): string[] {
  const errors: string[] = [];
  const required: Array<keyof EmailFunnelReport> = [
    "reportId",
    "timestamp",
    "affiliateProjectId",
    "funnelName",
    "leadMagnet",
    "funnelStages",
    "emailSequence",
    "callToActionStrategy",
    "conversionObjectives",
    "supportingEvidence",
    "auditStatus",
    "outstandingIssues",
    "confidenceScore",
    "metadataVersion",
  ];
  for (const key of required) {
    if (report[key] === undefined) errors.push(`Missing required field: ${key}`);
  }
  if (!report.consumableByQ807) errors.push("consumableByQ807 must be true");
  if (!report.neverFabricateConversionOrPerformanceClaims) {
    errors.push("neverFabricateConversionOrPerformanceClaims must be true");
  }
  if (report.leadMagnet?.fabricated) errors.push("Fabricated lead magnets are forbidden");
  if (report.emailSequence?.some((s) => s.fabricated)) {
    errors.push("Fabricated email sequences are forbidden");
  }
  return errors;
}

export function assertWorkerEnabled(config: EmailFunnelWorkerConfiguration) {
  if (!config.enabled) throw new Error("Email Funnel Worker is disabled");
  if (!config.funnelRulesEnabled) {
    throw new Error("Email Funnel Worker funnel rules disabled");
  }
}
