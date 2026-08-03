import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ANALYTICS_WORKER_IDENTITY,
  ANW_METADATA_VERSION,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { AnalyticsReport } from "./types.js";

export type AnalyticsWorkerConfiguration = {
  enabled: boolean;
  analyticsRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: AnalyticsReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverFabricateAnalyticsOrPerformanceResults: true;
  neverModifyCampaignsAutomatically: true;
  neverManipulateAnalytics: true;
  neverReplaceAffiliateComplianceWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ808OrLater: true;
  preserveCompleteTraceability: true;
  preserveAnalyticsHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_ANALYTICS_WORKER_CONFIGURATION: AnalyticsWorkerConfiguration = {
  enabled: true,
  analyticsRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: ANALYTICS_WORKER_IDENTITY.workerId,
  workerName: ANALYTICS_WORKER_IDENTITY.workerName,
  factory: ANALYTICS_WORKER_IDENTITY.factory,
  department: ANALYTICS_WORKER_IDENTITY.department,
  role: ANALYTICS_WORKER_IDENTITY.role,
  reportingLine: [...ANALYTICS_WORKER_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateAnalyticsOrPerformanceResults: true,
  neverModifyCampaignsAutomatically: true,
  neverManipulateAnalytics: true,
  neverReplaceAffiliateComplianceWorker: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ808OrLater: true,
  preserveCompleteTraceability: true,
  preserveAnalyticsHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildAnalyticsWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AnalyticsWorkerConfiguration> = {},
): AnalyticsWorkerConfiguration {
  let file: Partial<AnalyticsWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "analytics-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* defaults */
    }
  }
  return {
    ...DEFAULT_ANALYTICS_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_ANALYTICS_WORKER_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_ANALYTICS_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map(lockReport),
    neverFabricateAnalyticsOrPerformanceResults: true,
    neverModifyCampaignsAutomatically: true,
    neverManipulateAnalytics: true,
    neverReplaceAffiliateComplianceWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ808OrLater: true,
    preserveCompleteTraceability: true,
    preserveAnalyticsHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: AnalyticsReport): AnalyticsReport {
  return {
    ...report,
    metadataVersion: report.metadataVersion || ANW_METADATA_VERSION,
    optimisationOpportunities: report.optimisationOpportunities.map((o) => ({
      ...o,
      fabricated: false as const,
    })),
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    history: report.history.map((h) => ({ ...h })),
    consumableByQ808: true,
    neverFabricateAnalyticsOrPerformanceResults: true,
    neverModifyCampaignsAutomatically: true,
    neverManipulateAnalytics: true,
    neverReplaceAffiliateComplianceWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ808OrLater: true,
    preserveCompleteTraceability: true,
    preserveAnalyticsHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
