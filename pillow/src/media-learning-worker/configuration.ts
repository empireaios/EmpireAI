import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  LEARNING_OUTCOME_KINDS,
  MEDIA_LEARNING_WORKER_IDENTITY,
  MLW_METADATA_VERSION,
  PATTERN_DIMENSIONS,
} from "./paths.js";
import type { MediaLearningReport } from "./types.js";

export type MediaLearningWorkerConfiguration = {
  enabled: boolean;
  learningRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  learningOutcomeKinds: string[];
  patternDimensions: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedLearningReports: MediaLearningReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-16 hard boundaries — force-locked true. */
  neverRewriteExistingContent: true;
  neverModifyPublishedVideos: true;
  neverChangeEditorialPolicyDirectly: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ417OrLater: true;
  neverOverwriteHistoricalLearning: true;
  learnOnlyFromVerifiedAnalytics: true;
  preserveCompleteTraceability: true;
  preserveHistoricalLearningRecords: true;
  distinguishMeasuredOutcomesFromAssumptions: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_MEDIA_LEARNING_WORKER_CONFIGURATION: MediaLearningWorkerConfiguration = {
  enabled: true,
  learningRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  learningOutcomeKinds: [...LEARNING_OUTCOME_KINDS],
  patternDimensions: [...PATTERN_DIMENSIONS],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: MEDIA_LEARNING_WORKER_IDENTITY.workerId,
  workerName: MEDIA_LEARNING_WORKER_IDENTITY.workerName,
  factory: MEDIA_LEARNING_WORKER_IDENTITY.factory,
  department: MEDIA_LEARNING_WORKER_IDENTITY.department,
  role: MEDIA_LEARNING_WORKER_IDENTITY.role,
  reportingLine: [...MEDIA_LEARNING_WORKER_IDENTITY.reportingLine],
  seedLearningReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverRewriteExistingContent: true,
  neverModifyPublishedVideos: true,
  neverChangeEditorialPolicyDirectly: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ417OrLater: true,
  neverOverwriteHistoricalLearning: true,
  learnOnlyFromVerifiedAnalytics: true,
  preserveCompleteTraceability: true,
  preserveHistoricalLearningRecords: true,
  distinguishMeasuredOutcomesFromAssumptions: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildMediaLearningWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MediaLearningWorkerConfiguration> = {},
): MediaLearningWorkerConfiguration {
  let file: Partial<MediaLearningWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "media-learning-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.MEDIA_LEARNING_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.MEDIA_LEARNING_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (
    key: "integrationTargets" | "learningOutcomeKinds" | "patternDimensions",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_MEDIA_LEARNING_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_MEDIA_LEARNING_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    learningOutcomeKinds: mergeList("learningOutcomeKinds"),
    patternDimensions: mergeList("patternDimensions"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_MEDIA_LEARNING_WORKER_CONFIGURATION.reportingLine),
    ],
    seedLearningReports: (overrides.seedLearningReports ?? file.seedLearningReports ?? []).map(
      (r) => lockLearningReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverRewriteExistingContent: true,
    neverModifyPublishedVideos: true,
    neverChangeEditorialPolicyDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ417OrLater: true,
    neverOverwriteHistoricalLearning: true,
    learnOnlyFromVerifiedAnalytics: true,
    preserveCompleteTraceability: true,
    preserveHistoricalLearningRecords: true,
    distinguishMeasuredOutcomesFromAssumptions: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockLearningReport(report: MediaLearningReport): MediaLearningReport {
  return {
    ...report,
    mediaIdsAnalysed: [...report.mediaIdsAnalysed],
    successfulPatterns: report.successfulPatterns.map((p) => ({
      ...p,
      evidenceRefs: [...p.evidenceRefs],
    })),
    failedPatterns: report.failedPatterns.map((p) => ({
      ...p,
      evidenceRefs: [...p.evidenceRefs],
    })),
    topicInsights: report.topicInsights.map((i) => ({
      ...i,
      measuredSignals: [...i.measuredSignals],
      assumptions: [...i.assumptions],
    })),
    hookInsights: report.hookInsights.map((i) => ({
      ...i,
      measuredSignals: [...i.measuredSignals],
      assumptions: [...i.assumptions],
    })),
    thumbnailInsights: report.thumbnailInsights.map((i) => ({
      ...i,
      measuredSignals: [...i.measuredSignals],
      assumptions: [...i.assumptions],
    })),
    retentionInsights: report.retentionInsights.map((i) => ({
      ...i,
      measuredSignals: [...i.measuredSignals],
      assumptions: [...i.assumptions],
    })),
    publishingInsights: report.publishingInsights.map((i) => ({
      ...i,
      measuredSignals: [...i.measuredSignals],
      assumptions: [...i.assumptions],
    })),
    recommendedImprovements: report.recommendedImprovements.map((r) => ({ ...r })),
    playbookRecommendationUpdates: report.playbookRecommendationUpdates.map((u) => ({
      ...u,
      neverOverwroteHistoricalLearning: true as const,
    })),
    analyticsReportIds: [...report.analyticsReportIds],
    learningTraceabilityRefs: [...report.learningTraceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    historicalLearningRecordIds: [...report.historicalLearningRecordIds],
    metadataVersion: report.metadataVersion || MLW_METADATA_VERSION,
    verifiedAnalyticsOnly: true,
    neverRewriteExistingContent: true,
    neverModifyPublishedVideos: true,
    neverChangeEditorialPolicyDirectly: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ417OrLater: true,
    neverOverwriteHistoricalLearning: true,
    learnOnlyFromVerifiedAnalytics: true,
    preserveCompleteTraceability: true,
    preserveHistoricalLearningRecords: true,
    distinguishMeasuredOutcomesFromAssumptions: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
