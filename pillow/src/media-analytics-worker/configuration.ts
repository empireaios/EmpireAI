import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ANALYTICS_PLATFORMS,
  INTEGRATION_TARGETS,
  MAW_METADATA_VERSION,
  MEDIA_ANALYTICS_WORKER_IDENTITY,
  METRIC_SOURCES,
} from "./paths.js";
import type { MediaAnalyticsReport } from "./types.js";

export type MediaAnalyticsWorkerConfiguration = {
  enabled: boolean;
  analyticsRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultPlatform: string;
  supportedPlatforms: string[];
  metricSources: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedAnalyticsReports: MediaAnalyticsReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-15 hard boundaries — force-locked true. */
  neverRewriteContent: true;
  neverChangePublishingSchedules: true;
  neverModifyChannelStrategy: true;
  neverExecuteOptimizations: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ416OrLater: true;
  neverAlterSourceAnalyticsData: true;
  preserveCompleteMetricTraceability: true;
  preserveHistoricalPerformanceRecords: true;
  distinguishPlatformReportedFromEstimates: true;
  detectMeaningfulPerformanceChanges: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_MEDIA_ANALYTICS_WORKER_CONFIGURATION: MediaAnalyticsWorkerConfiguration = {
  enabled: true,
  analyticsRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultPlatform: "youtube",
  supportedPlatforms: [...ANALYTICS_PLATFORMS],
  metricSources: [...METRIC_SOURCES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: MEDIA_ANALYTICS_WORKER_IDENTITY.workerId,
  workerName: MEDIA_ANALYTICS_WORKER_IDENTITY.workerName,
  factory: MEDIA_ANALYTICS_WORKER_IDENTITY.factory,
  department: MEDIA_ANALYTICS_WORKER_IDENTITY.department,
  role: MEDIA_ANALYTICS_WORKER_IDENTITY.role,
  reportingLine: [...MEDIA_ANALYTICS_WORKER_IDENTITY.reportingLine],
  seedAnalyticsReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverRewriteContent: true,
  neverChangePublishingSchedules: true,
  neverModifyChannelStrategy: true,
  neverExecuteOptimizations: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ416OrLater: true,
  neverAlterSourceAnalyticsData: true,
  preserveCompleteMetricTraceability: true,
  preserveHistoricalPerformanceRecords: true,
  distinguishPlatformReportedFromEstimates: true,
  detectMeaningfulPerformanceChanges: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildMediaAnalyticsWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MediaAnalyticsWorkerConfiguration> = {},
): MediaAnalyticsWorkerConfiguration {
  let file: Partial<MediaAnalyticsWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "media-analytics-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.MEDIA_ANALYTICS_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.MEDIA_ANALYTICS_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (
    key: "integrationTargets" | "supportedPlatforms" | "metricSources",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_MEDIA_ANALYTICS_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_MEDIA_ANALYTICS_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedPlatforms: mergeList("supportedPlatforms"),
    metricSources: mergeList("metricSources"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_MEDIA_ANALYTICS_WORKER_CONFIGURATION.reportingLine),
    ],
    seedAnalyticsReports: (overrides.seedAnalyticsReports ?? file.seedAnalyticsReports ?? []).map(
      (r) => lockAnalyticsReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverRewriteContent: true,
    neverChangePublishingSchedules: true,
    neverModifyChannelStrategy: true,
    neverExecuteOptimizations: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ416OrLater: true,
    neverAlterSourceAnalyticsData: true,
    preserveCompleteMetricTraceability: true,
    preserveHistoricalPerformanceRecords: true,
    distinguishPlatformReportedFromEstimates: true,
    detectMeaningfulPerformanceChanges: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockAnalyticsReport(report: MediaAnalyticsReport): MediaAnalyticsReport {
  return {
    ...report,
    views: { ...report.views },
    impressions: { ...report.impressions },
    clickThroughRate: { ...report.clickThroughRate },
    watchTime: { ...report.watchTime },
    retentionMetrics: { ...report.retentionMetrics },
    subscriberImpact: { ...report.subscriberImpact },
    engagementMetrics: { ...report.engagementMetrics },
    revenueMetrics: { ...report.revenueMetrics },
    performancePatterns: report.performancePatterns.map((p) => ({
      ...p,
      evidenceRefs: [...p.evidenceRefs],
    })),
    comparisons: report.comparisons.map((c) => ({
      ...c,
      metricsCompared: [...c.metricsCompared],
    })),
    metricTraceabilityRefs: [...report.metricTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    historicalSnapshotIds: [...report.historicalSnapshotIds],
    metadataVersion: report.metadataVersion || MAW_METADATA_VERSION,
    neverRewriteContent: true,
    neverChangePublishingSchedules: true,
    neverModifyChannelStrategy: true,
    neverExecuteOptimizations: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ416OrLater: true,
    neverAlterSourceAnalyticsData: true,
    preserveCompleteMetricTraceability: true,
    preserveHistoricalPerformanceRecords: true,
    distinguishPlatformReportedFromEstimates: true,
    detectMeaningfulPerformanceChanges: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
