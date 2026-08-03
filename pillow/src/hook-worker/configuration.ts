import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTENT_FORMATS,
  HOOK_TYPES,
  INTEGRATION_TARGETS,
  HKW_METADATA_VERSION,
  HOOK_WORKER_IDENTITY,
} from "./paths.js";
import type { HookReport } from "./types.js";

export type HookWorkerConfiguration = {
  enabled: boolean;
  hookRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultContentFormat: string;
  supportedContentFormats: string[];
  supportedHookTypes: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedHookReports: HookReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-06 hard boundaries — force-locked true. */
  neverRewriteCompleteScript: true;
  neverGenerateThumbnails: true;
  neverGenerateVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ407OrLater: true;
  neverUseMisleadingOrDeceptiveHooks: true;
  preserveApprovedScriptIntent: true;
  generateOriginalHooks: true;
  preserveCompleteTraceability: true;
  performSelfReviewBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_HOOK_WORKER_CONFIGURATION: HookWorkerConfiguration = {
  enabled: true,
  hookRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultContentFormat: "explainer",
  supportedContentFormats: [...CONTENT_FORMATS],
  supportedHookTypes: [...HOOK_TYPES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: HOOK_WORKER_IDENTITY.workerId,
  workerName: HOOK_WORKER_IDENTITY.workerName,
  factory: HOOK_WORKER_IDENTITY.factory,
  department: HOOK_WORKER_IDENTITY.department,
  role: HOOK_WORKER_IDENTITY.role,
  reportingLine: [...HOOK_WORKER_IDENTITY.reportingLine],
  seedHookReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverRewriteCompleteScript: true,
  neverGenerateThumbnails: true,
  neverGenerateVideos: true,
  neverPublishContent: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ407OrLater: true,
  neverUseMisleadingOrDeceptiveHooks: true,
  preserveApprovedScriptIntent: true,
  generateOriginalHooks: true,
  preserveCompleteTraceability: true,
  performSelfReviewBeforeSubmission: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildHookWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<HookWorkerConfiguration> = {},
): HookWorkerConfiguration {
  let file: Partial<HookWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "hook-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.HOOK_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.HOOK_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (key: "integrationTargets" | "supportedContentFormats" | "supportedHookTypes") =>
    Array.from(
      new Set([
        ...DEFAULT_HOOK_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_HOOK_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedContentFormats: mergeList("supportedContentFormats"),
    supportedHookTypes: mergeList("supportedHookTypes"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_HOOK_WORKER_CONFIGURATION.reportingLine),
    ],
    seedHookReports: (overrides.seedHookReports ?? file.seedHookReports ?? []).map((r) =>
      lockHookReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverRewriteCompleteScript: true,
    neverGenerateThumbnails: true,
    neverGenerateVideos: true,
    neverPublishContent: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ407OrLater: true,
    neverUseMisleadingOrDeceptiveHooks: true,
    preserveApprovedScriptIntent: true,
    generateOriginalHooks: true,
    preserveCompleteTraceability: true,
    performSelfReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockHookReport(report: HookReport): HookReport {
  return {
    ...report,
    primaryHook: { ...report.primaryHook },
    alternativeHooks: report.alternativeHooks.map((h) => ({ ...h })),
    curiosityGaps: report.curiosityGaps.map((g) => ({ ...g })),
    retentionLoops: report.retentionLoops.map((l) => ({ ...l })),
    continuationMoments: report.continuationMoments.map((m) => ({ ...m })),
    pacingRecommendations: report.pacingRecommendations.map((p) => ({ ...p })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    metadataVersion: report.metadataVersion || HKW_METADATA_VERSION,
    neverRewriteCompleteScript: true,
    neverGenerateThumbnails: true,
    neverGenerateVideos: true,
    neverPublishContent: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ407OrLater: true,
    neverUseMisleadingOrDeceptiveHooks: true,
    preserveApprovedScriptIntent: true,
    generateOriginalHooks: true,
    preserveCompleteTraceability: true,
    performSelfReviewBeforeSubmission: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
