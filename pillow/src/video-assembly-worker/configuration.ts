import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  OUTPUT_ASPECTS,
  OUTPUT_RESOLUTIONS,
  VAW_METADATA_VERSION,
  VIDEO_ASSEMBLY_WORKER_IDENTITY,
} from "./paths.js";
import type { VideoAssemblyReport } from "./types.js";

export type VideoAssemblyWorkerConfiguration = {
  enabled: boolean;
  assemblyRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultAspects: string[];
  defaultResolutions: string[];
  defaultFrameRate: number;
  syncToleranceMs: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedAssemblyReports: VideoAssemblyReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-11 hard boundaries — force-locked true. */
  neverWriteScripts: true;
  neverGenerateVoiceovers: true;
  neverGenerateThumbnails: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ412OrLater: true;
  preserveCompleteAssetTraceability: true;
  preserveSynchronizationBetweenMediaAssets: true;
  validateRenderingQuality: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_VIDEO_ASSEMBLY_WORKER_CONFIGURATION: VideoAssemblyWorkerConfiguration = {
  enabled: true,
  assemblyRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultAspects: [...OUTPUT_ASPECTS],
  defaultResolutions: ["hd", "full_hd"],
  defaultFrameRate: 30,
  syncToleranceMs: 120,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: VIDEO_ASSEMBLY_WORKER_IDENTITY.workerId,
  workerName: VIDEO_ASSEMBLY_WORKER_IDENTITY.workerName,
  factory: VIDEO_ASSEMBLY_WORKER_IDENTITY.factory,
  department: VIDEO_ASSEMBLY_WORKER_IDENTITY.department,
  role: VIDEO_ASSEMBLY_WORKER_IDENTITY.role,
  reportingLine: [...VIDEO_ASSEMBLY_WORKER_IDENTITY.reportingLine],
  seedAssemblyReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverWriteScripts: true,
  neverGenerateVoiceovers: true,
  neverGenerateThumbnails: true,
  neverPublishMedia: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ412OrLater: true,
  preserveCompleteAssetTraceability: true,
  preserveSynchronizationBetweenMediaAssets: true,
  validateRenderingQuality: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildVideoAssemblyWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<VideoAssemblyWorkerConfiguration> = {},
): VideoAssemblyWorkerConfiguration {
  let file: Partial<VideoAssemblyWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "video-assembly-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.VIDEO_ASSEMBLY_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.VIDEO_ASSEMBLY_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (key: "integrationTargets" | "defaultAspects" | "defaultResolutions") =>
    Array.from(
      new Set([
        ...DEFAULT_VIDEO_ASSEMBLY_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_VIDEO_ASSEMBLY_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    defaultAspects: mergeList("defaultAspects"),
    defaultResolutions: mergeList("defaultResolutions"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_VIDEO_ASSEMBLY_WORKER_CONFIGURATION.reportingLine),
    ],
    seedAssemblyReports: (overrides.seedAssemblyReports ?? file.seedAssemblyReports ?? []).map((r) =>
      lockAssemblyReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverWriteScripts: true,
    neverGenerateVoiceovers: true,
    neverGenerateThumbnails: true,
    neverPublishMedia: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ412OrLater: true,
    preserveCompleteAssetTraceability: true,
    preserveSynchronizationBetweenMediaAssets: true,
    validateRenderingQuality: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockAssemblyReport(report: VideoAssemblyReport): VideoAssemblyReport {
  return {
    ...report,
    visualAssetIds: [...report.visualAssetIds],
    creativeAssetIds: [...report.creativeAssetIds],
    sceneTimeline: report.sceneTimeline.map((s) => ({
      ...s,
      visualAssetIds: [...s.visualAssetIds],
      creativeAssetIds: [...s.creativeAssetIds],
    })),
    renderSettings: {
      ...report.renderSettings,
      aspects: [...report.renderSettings.aspects],
      resolutions: [...report.renderSettings.resolutions],
    },
    outputFormats: report.outputFormats.map((f) => ({ ...f })),
    qualityValidation: { ...report.qualityValidation },
    finalVideoReference: {
      ...report.finalVideoReference,
      formats: report.finalVideoReference.formats.map((f) => ({ ...f })),
    },
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || VAW_METADATA_VERSION,
    neverWriteScripts: true,
    neverGenerateVoiceovers: true,
    neverGenerateThumbnails: true,
    neverPublishMedia: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ412OrLater: true,
    preserveCompleteAssetTraceability: true,
    preserveSynchronizationBetweenMediaAssets: true,
    validateRenderingQuality: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
