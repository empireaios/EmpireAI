import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTENT_FORMATS,
  DESIGN_ELEMENTS,
  EMOTIONAL_TRIGGERS,
  INTEGRATION_TARGETS,
  THW_METADATA_VERSION,
  THUMBNAIL_WORKER_IDENTITY,
} from "./paths.js";
import type { ThumbnailReport } from "./types.js";

export type ThumbnailWorkerConfiguration = {
  enabled: boolean;
  thumbnailRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultContentFormat: string;
  supportedContentFormats: string[];
  supportedDesignElements: string[];
  supportedEmotionalTriggers: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedThumbnailReports: ThumbnailReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-07 hard boundaries — force-locked true. */
  neverGenerateFinalArtwork: true;
  neverEditImagesDirectly: true;
  neverPublishThumbnails: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ408OrLater: true;
  neverUseMisleadingOrDeceptiveThumbnails: true;
  followEditorInChiefStrategy: true;
  remainConsistentWithApprovedScript: true;
  produceMultipleDesignAlternatives: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_THUMBNAIL_WORKER_CONFIGURATION: ThumbnailWorkerConfiguration = {
  enabled: true,
  thumbnailRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultContentFormat: "explainer",
  supportedContentFormats: [...CONTENT_FORMATS],
  supportedDesignElements: [...DESIGN_ELEMENTS],
  supportedEmotionalTriggers: [...EMOTIONAL_TRIGGERS],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: THUMBNAIL_WORKER_IDENTITY.workerId,
  workerName: THUMBNAIL_WORKER_IDENTITY.workerName,
  factory: THUMBNAIL_WORKER_IDENTITY.factory,
  department: THUMBNAIL_WORKER_IDENTITY.department,
  role: THUMBNAIL_WORKER_IDENTITY.role,
  reportingLine: [...THUMBNAIL_WORKER_IDENTITY.reportingLine],
  seedThumbnailReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverGenerateFinalArtwork: true,
  neverEditImagesDirectly: true,
  neverPublishThumbnails: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ408OrLater: true,
  neverUseMisleadingOrDeceptiveThumbnails: true,
  followEditorInChiefStrategy: true,
  remainConsistentWithApprovedScript: true,
  produceMultipleDesignAlternatives: true,
  preserveCompleteTraceability: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildThumbnailWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ThumbnailWorkerConfiguration> = {},
): ThumbnailWorkerConfiguration {
  let file: Partial<ThumbnailWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "thumbnail-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.THUMBNAIL_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.THUMBNAIL_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (
    key: "integrationTargets" | "supportedContentFormats" | "supportedDesignElements" | "supportedEmotionalTriggers",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_THUMBNAIL_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_THUMBNAIL_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedContentFormats: mergeList("supportedContentFormats"),
    supportedDesignElements: mergeList("supportedDesignElements"),
    supportedEmotionalTriggers: mergeList("supportedEmotionalTriggers"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_THUMBNAIL_WORKER_CONFIGURATION.reportingLine),
    ],
    seedThumbnailReports: (overrides.seedThumbnailReports ?? file.seedThumbnailReports ?? []).map((r) =>
      lockThumbnailReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverGenerateFinalArtwork: true,
    neverEditImagesDirectly: true,
    neverPublishThumbnails: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ408OrLater: true,
    neverUseMisleadingOrDeceptiveThumbnails: true,
    followEditorInChiefStrategy: true,
    remainConsistentWithApprovedScript: true,
    produceMultipleDesignAlternatives: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockThumbnailReport(report: ThumbnailReport): ThumbnailReport {
  return {
    ...report,
    thumbnailConcepts: report.thumbnailConcepts.map((c) => ({ ...c })),
    primaryConcept: { ...report.primaryConcept },
    abVariants: report.abVariants.map((v) => ({ ...v })),
    textOverlays: report.textOverlays.map((t) => ({ ...t })),
    emotionalTriggers: report.emotionalTriggers.map((e) => ({ ...e })),
    compositionGuidance: { ...report.compositionGuidance },
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    selfReviewFindings: report.selfReviewFindings.map((f) => ({ ...f })),
    metadataVersion: report.metadataVersion || THW_METADATA_VERSION,
    neverGenerateFinalArtwork: true,
    neverEditImagesDirectly: true,
    neverPublishThumbnails: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ408OrLater: true,
    neverUseMisleadingOrDeceptiveThumbnails: true,
    followEditorInChiefStrategy: true,
    remainConsistentWithApprovedScript: true,
    produceMultipleDesignAlternatives: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
