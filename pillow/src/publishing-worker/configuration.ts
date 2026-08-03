import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  PBW_METADATA_VERSION,
  PUBLISHING_PLATFORMS,
  PUBLISHING_WORKER_IDENTITY,
  READINESS_STATUSES,
} from "./paths.js";
import type { PublishingReport } from "./types.js";

export type PublishingWorkerConfiguration = {
  enabled: boolean;
  publishingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultPlatform: string;
  supportedPlatforms: string[];
  readinessStatuses: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedPublishingReports: PublishingReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-14 hard boundaries — force-locked true. */
  neverAutomaticallyPublishContent: true;
  neverModifyApprovedMediaAssets: true;
  neverOverrideApprovalWorkflows: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ415OrLater: true;
  preserveCompleteAssetTraceability: true;
  preservePublishingMetadataHistory: true;
  validatePlatformRequirements: true;
  validateApprovalStatusBeforePublication: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_PUBLISHING_WORKER_CONFIGURATION: PublishingWorkerConfiguration = {
  enabled: true,
  publishingRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultPlatform: "youtube",
  supportedPlatforms: [...PUBLISHING_PLATFORMS],
  readinessStatuses: [...READINESS_STATUSES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: PUBLISHING_WORKER_IDENTITY.workerId,
  workerName: PUBLISHING_WORKER_IDENTITY.workerName,
  factory: PUBLISHING_WORKER_IDENTITY.factory,
  department: PUBLISHING_WORKER_IDENTITY.department,
  role: PUBLISHING_WORKER_IDENTITY.role,
  reportingLine: [...PUBLISHING_WORKER_IDENTITY.reportingLine],
  seedPublishingReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverAutomaticallyPublishContent: true,
  neverModifyApprovedMediaAssets: true,
  neverOverrideApprovalWorkflows: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ415OrLater: true,
  preserveCompleteAssetTraceability: true,
  preservePublishingMetadataHistory: true,
  validatePlatformRequirements: true,
  validateApprovalStatusBeforePublication: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildPublishingWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PublishingWorkerConfiguration> = {},
): PublishingWorkerConfiguration {
  let file: Partial<PublishingWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "publishing-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PUBLISHING_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.PUBLISHING_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (
    key: "integrationTargets" | "supportedPlatforms" | "readinessStatuses",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_PUBLISHING_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_PUBLISHING_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedPlatforms: mergeList("supportedPlatforms"),
    readinessStatuses: mergeList("readinessStatuses"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_PUBLISHING_WORKER_CONFIGURATION.reportingLine),
    ],
    seedPublishingReports: (overrides.seedPublishingReports ?? file.seedPublishingReports ?? []).map(
      (r) => lockPublishingReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverAutomaticallyPublishContent: true,
    neverModifyApprovedMediaAssets: true,
    neverOverrideApprovalWorkflows: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ415OrLater: true,
    preserveCompleteAssetTraceability: true,
    preservePublishingMetadataHistory: true,
    validatePlatformRequirements: true,
    validateApprovalStatusBeforePublication: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockPublishingReport(report: PublishingReport): PublishingReport {
  return {
    ...report,
    tags: [...report.tags],
    thumbnailReference: { ...report.thumbnailReference, approved: true },
    playlist: { ...report.playlist },
    uploadPackage: {
      ...report.uploadPackage,
      tags: [...report.uploadPackage.tags],
      assetRefs: [...report.uploadPackage.assetRefs],
    },
    publishingReadiness: { ...report.publishingReadiness },
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || PBW_METADATA_VERSION,
    pillowAuthorizationRequired: true,
    automaticallyPublishAuthorized: false,
    neverAutomaticallyPublishContent: true,
    neverModifyApprovedMediaAssets: true,
    neverOverrideApprovalWorkflows: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ415OrLater: true,
    preserveCompleteAssetTraceability: true,
    preservePublishingMetadataHistory: true,
    validatePlatformRequirements: true,
    validateApprovalStatusBeforePublication: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
