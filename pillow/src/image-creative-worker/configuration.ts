import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CREATIVE_ASSET_TYPES,
  ICW_METADATA_VERSION,
  IMAGE_CREATIVE_WORKER_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type { CreativeAssetReport } from "./types.js";

export type ImageCreativeWorkerConfiguration = {
  enabled: boolean;
  creativeRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultAssetType: string;
  supportedAssetTypes: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedCreativeAssetReports: CreativeAssetReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-09 hard boundaries — force-locked true. */
  neverAssembleVideos: true;
  neverGenerateVoiceovers: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ410OrLater: true;
  preserveCompleteAssetTraceability: true;
  respectCopyrightAndLicensing: true;
  preserveOriginalAssets: true;
  recordAllEditsPerformed: true;
  produceMultipleVariantsWhenAppropriate: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_IMAGE_CREATIVE_WORKER_CONFIGURATION: ImageCreativeWorkerConfiguration = {
  enabled: true,
  creativeRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultAssetType: "supporting_visual",
  supportedAssetTypes: [...CREATIVE_ASSET_TYPES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: IMAGE_CREATIVE_WORKER_IDENTITY.workerId,
  workerName: IMAGE_CREATIVE_WORKER_IDENTITY.workerName,
  factory: IMAGE_CREATIVE_WORKER_IDENTITY.factory,
  department: IMAGE_CREATIVE_WORKER_IDENTITY.department,
  role: IMAGE_CREATIVE_WORKER_IDENTITY.role,
  reportingLine: [...IMAGE_CREATIVE_WORKER_IDENTITY.reportingLine],
  seedCreativeAssetReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverAssembleVideos: true,
  neverGenerateVoiceovers: true,
  neverPublishMedia: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ410OrLater: true,
  preserveCompleteAssetTraceability: true,
  respectCopyrightAndLicensing: true,
  preserveOriginalAssets: true,
  recordAllEditsPerformed: true,
  produceMultipleVariantsWhenAppropriate: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildImageCreativeWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ImageCreativeWorkerConfiguration> = {},
): ImageCreativeWorkerConfiguration {
  let file: Partial<ImageCreativeWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "image-creative-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.IMAGE_CREATIVE_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.IMAGE_CREATIVE_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (key: "integrationTargets" | "supportedAssetTypes") =>
    Array.from(
      new Set([
        ...DEFAULT_IMAGE_CREATIVE_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_IMAGE_CREATIVE_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedAssetTypes: mergeList("supportedAssetTypes"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_IMAGE_CREATIVE_WORKER_CONFIGURATION.reportingLine),
    ],
    seedCreativeAssetReports: (overrides.seedCreativeAssetReports ?? file.seedCreativeAssetReports ?? []).map(
      (r) => lockCreativeAssetReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverAssembleVideos: true,
    neverGenerateVoiceovers: true,
    neverPublishMedia: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ410OrLater: true,
    preserveCompleteAssetTraceability: true,
    respectCopyrightAndLicensing: true,
    preserveOriginalAssets: true,
    recordAllEditsPerformed: true,
    produceMultipleVariantsWhenAppropriate: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockCreativeAssetReport(report: CreativeAssetReport): CreativeAssetReport {
  return {
    ...report,
    sourceAssets: [...report.sourceAssets],
    generatedAssets: [...report.generatedAssets],
    editOperations: report.editOperations.map((e) => ({ ...e })),
    variants: report.variants.map((v) => ({ ...v })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || ICW_METADATA_VERSION,
    neverAssembleVideos: true,
    neverGenerateVoiceovers: true,
    neverPublishMedia: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ410OrLater: true,
    preserveCompleteAssetTraceability: true,
    respectCopyrightAndLicensing: true,
    preserveOriginalAssets: true,
    recordAllEditsPerformed: true,
    produceMultipleVariantsWhenAppropriate: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
