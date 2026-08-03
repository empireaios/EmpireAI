import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  RCW_METADATA_VERSION,
  REVIEW_CONTENT_WORKER_IDENTITY,
} from "./paths.js";
import type { ReviewContentReport } from "./types.js";

export type ReviewContentWorkerConfiguration = {
  enabled: boolean;
  reviewRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: ReviewContentReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverFabricateReviewsRatingsOrProductInformation: true;
  neverPublishWebsites: true;
  neverManipulateRatings: true;
  neverReplaceComparisonSiteWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ805OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_REVIEW_CONTENT_WORKER_CONFIGURATION: ReviewContentWorkerConfiguration = {
  enabled: true,
  reviewRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: REVIEW_CONTENT_WORKER_IDENTITY.workerId,
  workerName: REVIEW_CONTENT_WORKER_IDENTITY.workerName,
  factory: REVIEW_CONTENT_WORKER_IDENTITY.factory,
  department: REVIEW_CONTENT_WORKER_IDENTITY.department,
  role: REVIEW_CONTENT_WORKER_IDENTITY.role,
  reportingLine: [...REVIEW_CONTENT_WORKER_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateReviewsRatingsOrProductInformation: true,
  neverPublishWebsites: true,
  neverManipulateRatings: true,
  neverReplaceComparisonSiteWorker: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ805OrLater: true,
  preserveCompleteTraceability: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildReviewContentWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ReviewContentWorkerConfiguration> = {},
): ReviewContentWorkerConfiguration {
  let file: Partial<ReviewContentWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "review-content-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* defaults */
    }
  }
  return {
    ...DEFAULT_REVIEW_CONTENT_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_REVIEW_CONTENT_WORKER_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_REVIEW_CONTENT_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map(lockReport),
    neverFabricateReviewsRatingsOrProductInformation: true,
    neverPublishWebsites: true,
    neverManipulateRatings: true,
    neverReplaceComparisonSiteWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ805OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: ReviewContentReport): ReviewContentReport {
  return {
    ...report,
    metadataVersion: report.metadataVersion || RCW_METADATA_VERSION,
    pros: [...report.pros],
    cons: [...report.cons],
    alternatives: report.alternatives.map((a) => ({ ...a, fabricated: false as const })),
    supportingEvidence: [...report.supportingEvidence],
    outstandingIssues: [...report.outstandingIssues],
    traceabilityRefs: [...report.traceabilityRefs],
    versionHistory: report.versionHistory.map((v) => ({ ...v })),
    consumableByQ805: true,
    neverFabricateReviewsRatingsOrProductInformation: true,
    neverPublishWebsites: true,
    neverManipulateRatings: true,
    neverReplaceComparisonSiteWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ805OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
