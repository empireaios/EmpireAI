import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  SEO_CONTENT_WORKER_IDENTITY,
  SEOW_METADATA_VERSION,
} from "./paths.js";
import type { SeoContentReport } from "./types.js";

export type SeoContentWorkerConfiguration = {
  enabled: boolean;
  seoRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: SeoContentReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverFabricateSeoPerformanceClaims: true;
  neverPublishArticles: true;
  neverManipulateSearchRankings: true;
  neverReplaceAnalyticsWorker: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ806OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_SEO_CONTENT_WORKER_CONFIGURATION: SeoContentWorkerConfiguration = {
  enabled: true,
  seoRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: SEO_CONTENT_WORKER_IDENTITY.workerId,
  workerName: SEO_CONTENT_WORKER_IDENTITY.workerName,
  factory: SEO_CONTENT_WORKER_IDENTITY.factory,
  department: SEO_CONTENT_WORKER_IDENTITY.department,
  role: SEO_CONTENT_WORKER_IDENTITY.role,
  reportingLine: [...SEO_CONTENT_WORKER_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverFabricateSeoPerformanceClaims: true,
  neverPublishArticles: true,
  neverManipulateSearchRankings: true,
  neverReplaceAnalyticsWorker: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ806OrLater: true,
  preserveCompleteTraceability: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildSeoContentWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SeoContentWorkerConfiguration> = {},
): SeoContentWorkerConfiguration {
  let file: Partial<SeoContentWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "seo-content-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* defaults */
    }
  }
  return {
    ...DEFAULT_SEO_CONTENT_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: Array.from(
      new Set([
        ...DEFAULT_SEO_CONTENT_WORKER_CONFIGURATION.integrationTargets,
        ...((file.integrationTargets as string[] | undefined) ?? []),
        ...((overrides.integrationTargets as string[] | undefined) ?? []),
      ]),
    ),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_SEO_CONTENT_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map(lockReport),
    neverFabricateSeoPerformanceClaims: true,
    neverPublishArticles: true,
    neverManipulateSearchRankings: true,
    neverReplaceAnalyticsWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ806OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}

function lockReport(report: SeoContentReport): SeoContentReport {
  return {
    ...report,
    metadataVersion: report.metadataVersion || SEOW_METADATA_VERSION,
    targetKeywords: report.targetKeywords.map((k) => ({ ...k, fabricated: false as const })),
    internalLinkingPlan: report.internalLinkingPlan.map((l) => ({
      ...l,
      fabricated: false as const,
    })),
    outstandingIssues: [...report.outstandingIssues],
    supportingEvidence: [...report.supportingEvidence],
    traceabilityRefs: [...report.traceabilityRefs],
    versionHistory: report.versionHistory.map((v) => ({ ...v })),
    consumableByQ806: true,
    neverFabricateSeoPerformanceClaims: true,
    neverPublishArticles: true,
    neverManipulateSearchRankings: true,
    neverReplaceAnalyticsWorker: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ806OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
