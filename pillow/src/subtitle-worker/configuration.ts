import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EXPORT_FORMATS,
  INTEGRATION_TARGETS,
  STW_METADATA_VERSION,
  SUBTITLE_LANGUAGES,
  SUBTITLE_WORKER_IDENTITY,
} from "./paths.js";
import type { SubtitleReport } from "./types.js";

export type SubtitleWorkerConfiguration = {
  enabled: boolean;
  subtitleRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultLanguage: string;
  supportedLanguages: string[];
  supportedExportFormats: string[];
  timingToleranceMs: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedSubtitleReports: SubtitleReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-12 hard boundaries — force-locked true. */
  neverRewriteScripts: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ413OrLater: true;
  neverModifyApprovedScripts: true;
  preserveScriptTraceability: true;
  preserveSubtitleSynchronization: true;
  preserveTranscriptHistory: true;
  validateSubtitleQuality: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SUBTITLE_WORKER_CONFIGURATION: SubtitleWorkerConfiguration = {
  enabled: true,
  subtitleRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultLanguage: "en-US",
  supportedLanguages: [...SUBTITLE_LANGUAGES],
  supportedExportFormats: [...EXPORT_FORMATS],
  timingToleranceMs: 150,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: SUBTITLE_WORKER_IDENTITY.workerId,
  workerName: SUBTITLE_WORKER_IDENTITY.workerName,
  factory: SUBTITLE_WORKER_IDENTITY.factory,
  department: SUBTITLE_WORKER_IDENTITY.department,
  role: SUBTITLE_WORKER_IDENTITY.role,
  reportingLine: [...SUBTITLE_WORKER_IDENTITY.reportingLine],
  seedSubtitleReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverRewriteScripts: true,
  neverAssembleVideos: true,
  neverPublishContent: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ413OrLater: true,
  neverModifyApprovedScripts: true,
  preserveScriptTraceability: true,
  preserveSubtitleSynchronization: true,
  preserveTranscriptHistory: true,
  validateSubtitleQuality: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildSubtitleWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SubtitleWorkerConfiguration> = {},
): SubtitleWorkerConfiguration {
  let file: Partial<SubtitleWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "subtitle-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.SUBTITLE_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.SUBTITLE_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (
    key: "integrationTargets" | "supportedLanguages" | "supportedExportFormats",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_SUBTITLE_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_SUBTITLE_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedLanguages: mergeList("supportedLanguages"),
    supportedExportFormats: mergeList("supportedExportFormats"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_SUBTITLE_WORKER_CONFIGURATION.reportingLine),
    ],
    seedSubtitleReports: (overrides.seedSubtitleReports ?? file.seedSubtitleReports ?? []).map((r) =>
      lockSubtitleReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverRewriteScripts: true,
    neverAssembleVideos: true,
    neverPublishContent: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ413OrLater: true,
    neverModifyApprovedScripts: true,
    preserveScriptTraceability: true,
    preserveSubtitleSynchronization: true,
    preserveTranscriptHistory: true,
    validateSubtitleQuality: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockSubtitleReport(report: SubtitleReport): SubtitleReport {
  return {
    ...report,
    captionTimeline: report.captionTimeline.map((c) => ({ ...c })),
    timingAccuracy: { ...report.timingAccuracy },
    exportFormats: report.exportFormats.map((f) => ({ ...f })),
    qualityValidation: { ...report.qualityValidation },
    languages: [...report.languages],
    syncIssues: report.syncIssues.map((i) => ({ ...i })),
    transcriptHistory: report.transcriptHistory.map((t) => ({ ...t })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || STW_METADATA_VERSION,
    neverRewriteScripts: true,
    neverAssembleVideos: true,
    neverPublishContent: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ413OrLater: true,
    neverModifyApprovedScripts: true,
    preserveScriptTraceability: true,
    preserveSubtitleSynchronization: true,
    preserveTranscriptHistory: true,
    validateSubtitleQuality: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
