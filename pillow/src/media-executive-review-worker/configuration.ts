import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EXECUTIVE_RECOMMENDATIONS,
  INTEGRATION_TARGETS,
  MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY,
  MER_METADATA_VERSION,
} from "./paths.js";
import type { MediaExecutiveReviewReport } from "./types.js";

export type MediaExecutiveReviewWorkerConfiguration = {
  enabled: boolean;
  reviewRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  approveCompletenessThreshold: number;
  reviseCompletenessThreshold: number;
  executiveRecommendations: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReviewReports: MediaExecutiveReviewReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-18 hard boundaries — force-locked true. */
  neverPublishMedia: true;
  neverRewriteScripts: true;
  neverEditMediaAssets: true;
  neverModifyApprovedAssets: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ419OrLater: true;
  neverBypassPillowGovernance: true;
  verifyAllPrerequisiteWorkersCompletedSuccessfully: true;
  preserveCompleteTraceability: true;
  distinguishVerifiedFindingsFromRecommendations: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_MEDIA_EXECUTIVE_REVIEW_WORKER_CONFIGURATION: MediaExecutiveReviewWorkerConfiguration =
  {
    enabled: true,
    reviewRulesEnabled: true,
    validationRulesEnabled: true,
    executiveReportingEnabled: true,
    approveCompletenessThreshold: 80,
    reviseCompletenessThreshold: 40,
    executiveRecommendations: [...EXECUTIVE_RECOMMENDATIONS],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.workerId,
    workerName: MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.workerName,
    factory: MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.factory,
    department: MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.department,
    role: MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.role,
    reportingLine: [...MEDIA_EXECUTIVE_REVIEW_WORKER_IDENTITY.reportingLine],
    seedReviewReports: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverPublishMedia: true,
    neverRewriteScripts: true,
    neverEditMediaAssets: true,
    neverModifyApprovedAssets: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ419OrLater: true,
    neverBypassPillowGovernance: true,
    verifyAllPrerequisiteWorkersCompletedSuccessfully: true,
    preserveCompleteTraceability: true,
    distinguishVerifiedFindingsFromRecommendations: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildMediaExecutiveReviewWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MediaExecutiveReviewWorkerConfiguration> = {},
): MediaExecutiveReviewWorkerConfiguration {
  let file: Partial<MediaExecutiveReviewWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "media-executive-review-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.MEDIA_EXECUTIVE_REVIEW_WORKER_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.MEDIA_EXECUTIVE_REVIEW_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );
  const mergeList = (key: "integrationTargets" | "executiveRecommendations") =>
    Array.from(
      new Set([
        ...DEFAULT_MEDIA_EXECUTIVE_REVIEW_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_MEDIA_EXECUTIVE_REVIEW_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    executiveRecommendations: mergeList("executiveRecommendations"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_MEDIA_EXECUTIVE_REVIEW_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReviewReports: (
      overrides.seedReviewReports ??
      file.seedReviewReports ??
      []
    ).map((r) => lockReviewReport(r)),
    approveCompletenessThreshold:
      overrides.approveCompletenessThreshold ??
      file.approveCompletenessThreshold ??
      DEFAULT_MEDIA_EXECUTIVE_REVIEW_WORKER_CONFIGURATION.approveCompletenessThreshold,
    reviseCompletenessThreshold:
      overrides.reviseCompletenessThreshold ??
      file.reviseCompletenessThreshold ??
      DEFAULT_MEDIA_EXECUTIVE_REVIEW_WORKER_CONFIGURATION.reviseCompletenessThreshold,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverPublishMedia: true,
    neverRewriteScripts: true,
    neverEditMediaAssets: true,
    neverModifyApprovedAssets: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ419OrLater: true,
    neverBypassPillowGovernance: true,
    verifyAllPrerequisiteWorkersCompletedSuccessfully: true,
    preserveCompleteTraceability: true,
    distinguishVerifiedFindingsFromRecommendations: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockReviewReport(report: MediaExecutiveReviewReport): MediaExecutiveReviewReport {
  return {
    ...report,
    assetCompleteness: {
      ...report.assetCompleteness,
      missingItems: [...report.assetCompleteness.missingItems],
    },
    qualityAssessment: { ...report.qualityAssessment },
    complianceAssessment: { ...report.complianceAssessment },
    outstandingIssues: report.outstandingIssues.map((f) => ({
      ...f,
      evidenceRefs: [...f.evidenceRefs],
    })),
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    prerequisiteWorkerStatuses: report.prerequisiteWorkerStatuses.map((p) => ({ ...p })),
    verifiedFindings: report.verifiedFindings.map((f) => ({
      ...f,
      evidenceRefs: [...f.evidenceRefs],
    })),
    recommendationFindings: report.recommendationFindings.map((f) => ({
      ...f,
      evidenceRefs: [...f.evidenceRefs],
    })),
    sourceTraceabilityRefs: [...report.sourceTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || MER_METADATA_VERSION,
    neverPublishMedia: true,
    neverRewriteScripts: true,
    neverEditMediaAssets: true,
    neverModifyApprovedAssets: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ419OrLater: true,
    neverBypassPillowGovernance: true,
    verifyAllPrerequisiteWorkersCompletedSuccessfully: true,
    preserveCompleteTraceability: true,
    distinguishVerifiedFindingsFromRecommendations: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
