import type { AnalyticsWorkerConfiguration } from "./configuration.js";
import type { AnalyticsReport, AnwInput } from "./types.js";

export function validateBoundaryInput(input: AnwInput): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (input.fabricateAnalyticsOrPerformanceResults) {
    errors.push("Boundary violation: never fabricate analytics or performance results");
  }
  if (input.modifyCampaignsAutomatically) {
    errors.push("Boundary violation: never modify campaigns automatically");
  }
  if (input.manipulateAnalytics) {
    errors.push("Boundary violation: never manipulate analytics");
  }
  if (input.replaceAffiliateComplianceWorker) {
    errors.push("Boundary violation: never replace Affiliate Compliance Worker");
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
  if (input.implementQ808OrLater) {
    errors.push("Boundary violation: never implement Q8-08 or later");
  }
  const mission = input.missionId?.trim().toUpperCase() ?? "";
  if (mission.startsWith("Q8-") && mission !== "Q8-07") {
    const num = Number(mission.replace("Q8-", ""));
    if (Number.isFinite(num) && num >= 8) {
      errors.push(`Boundary violation: mission ${mission} is Q8-08 or later`);
    }
  }
  return { valid: errors.length === 0, errors, warnings };
}

export function validateReportShape(report: AnalyticsReport): string[] {
  const errors: string[] = [];
  const required: Array<keyof AnalyticsReport> = [
    "reportId",
    "timestamp",
    "affiliateProjectId",
    "clickMetrics",
    "conversionMetrics",
    "commissionSummary",
    "revenueSummary",
    "seoPerformance",
    "funnelPerformance",
    "optimisationOpportunities",
    "trendAnalysis",
    "auditStatus",
    "outstandingIssues",
    "confidenceScore",
    "metadataVersion",
  ];
  for (const key of required) {
    if (report[key] === undefined) errors.push(`Missing required field: ${key}`);
  }
  if (!report.consumableByQ808) errors.push("consumableByQ808 must be true");
  if (!report.neverFabricateAnalyticsOrPerformanceResults) {
    errors.push("neverFabricateAnalyticsOrPerformanceResults must be true");
  }
  if (report.clickMetrics?.fabricated) errors.push("Fabricated click metrics are forbidden");
  if (report.conversionMetrics?.fabricated) {
    errors.push("Fabricated conversion metrics are forbidden");
  }
  return errors;
}

export function assertWorkerEnabled(config: AnalyticsWorkerConfiguration) {
  if (!config.enabled) throw new Error("Analytics Worker is disabled");
  if (!config.analyticsRulesEnabled) {
    throw new Error("Analytics Worker analytics rules disabled");
  }
}
