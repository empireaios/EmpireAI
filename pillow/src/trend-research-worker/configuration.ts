import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  TRW_METADATA_VERSION,
  TREND_RESEARCH_WORKER_IDENTITY,
} from "./paths.js";
import type { TrendResearchReport } from "./types.js";

export type TrendResearchWorkerConfiguration = {
  enabled: boolean;
  trendRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  emergingScoreThreshold: number;
  decliningScoreThreshold: number;
  criticalConfidenceThreshold: number;
  highConfidenceThreshold: number;
  mediumConfidenceThreshold: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedReports: TrendResearchReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-03 hard boundaries — force-locked true. */
  neverSelectPublishingTopics: true;
  neverWriteScripts: true;
  neverGenerateThumbnails: true;
  neverPublishContent: true;
  neverGenerateContentDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ404OrLater: true;
  useApprovedResearchSourcesOnly: true;
  preserveCompleteSourceTraceability: true;
  preserveHistoricalTrendRecords: true;
  distinguishFactsFromAssumptions: true;
  preserveAuditHistory: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_TREND_RESEARCH_WORKER_CONFIGURATION: TrendResearchWorkerConfiguration = {
  enabled: true,
  trendRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  emergingScoreThreshold: 70,
  decliningScoreThreshold: 35,
  criticalConfidenceThreshold: 85,
  highConfidenceThreshold: 70,
  mediumConfidenceThreshold: 50,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: TREND_RESEARCH_WORKER_IDENTITY.workerId,
  workerName: TREND_RESEARCH_WORKER_IDENTITY.workerName,
  factory: TREND_RESEARCH_WORKER_IDENTITY.factory,
  department: TREND_RESEARCH_WORKER_IDENTITY.department,
  role: TREND_RESEARCH_WORKER_IDENTITY.role,
  reportingLine: [...TREND_RESEARCH_WORKER_IDENTITY.reportingLine],
  seedReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverSelectPublishingTopics: true,
  neverWriteScripts: true,
  neverGenerateThumbnails: true,
  neverPublishContent: true,
  neverGenerateContentDirectly: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ404OrLater: true,
  useApprovedResearchSourcesOnly: true,
  preserveCompleteSourceTraceability: true,
  preserveHistoricalTrendRecords: true,
  distinguishFactsFromAssumptions: true,
  preserveAuditHistory: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildTrendResearchWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<TrendResearchWorkerConfiguration> = {},
): TrendResearchWorkerConfiguration {
  let file: Partial<TrendResearchWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "trend-research-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.TREND_RESEARCH_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(
    process.env.TREND_RESEARCH_WORKER_RETRY_ATTEMPTS ?? "",
    10,
  );
  const mergeList = (key: "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_TREND_RESEARCH_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_TREND_RESEARCH_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_TREND_RESEARCH_WORKER_CONFIGURATION.reportingLine),
    ],
    seedReports: (overrides.seedReports ?? file.seedReports ?? []).map((r) => lockReport(r)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverSelectPublishingTopics: true,
    neverWriteScripts: true,
    neverGenerateThumbnails: true,
    neverPublishContent: true,
    neverGenerateContentDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ404OrLater: true,
    useApprovedResearchSourcesOnly: true,
    preserveCompleteSourceTraceability: true,
    preserveHistoricalTrendRecords: true,
    distinguishFactsFromAssumptions: true,
    preserveAuditHistory: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockReport(report: TrendResearchReport): TrendResearchReport {
  return {
    ...report,
    searchDemand: { ...report.searchDemand },
    socialSignals: { ...report.socialSignals },
    competitorActivity: { ...report.competitorActivity },
    currentEventRelevance: { ...report.currentEventRelevance },
    supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
    evidenceKinds: [...report.evidenceKinds],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || TRW_METADATA_VERSION,
    neverSelectPublishingTopics: true,
    neverWriteScripts: true,
    neverGenerateThumbnails: true,
    neverPublishContent: true,
    neverGenerateContentDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ404OrLater: true,
    useApprovedResearchSourcesOnly: true,
    preserveCompleteSourceTraceability: true,
    preserveHistoricalTrendRecords: true,
    distinguishFactsFromAssumptions: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
