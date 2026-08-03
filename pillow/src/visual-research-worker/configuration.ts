import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPROVED_VISUAL_SOURCES,
  ASSET_TYPES,
  CONTENT_FORMATS,
  INTEGRATION_TARGETS,
  VRW_METADATA_VERSION,
  VISUAL_RESEARCH_WORKER_IDENTITY,
} from "./paths.js";
import type { VisualResearchReport } from "./types.js";

export type VisualResearchWorkerConfiguration = {
  enabled: boolean;
  visualResearchRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultContentFormat: string;
  supportedContentFormats: string[];
  supportedAssetTypes: string[];
  approvedVisualSources: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedVisualResearchReports: VisualResearchReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-08 hard boundaries — force-locked true. */
  neverGenerateFinalCreativeAssets: true;
  neverEditImages: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ409OrLater: true;
  useOnlyApprovedVisualSources: true;
  preserveCompleteAssetTraceability: true;
  preserveCopyrightInformation: true;
  identifyLicensingRestrictions: true;
  detectMissingVisualAssets: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_VISUAL_RESEARCH_WORKER_CONFIGURATION: VisualResearchWorkerConfiguration = {
  enabled: true,
  visualResearchRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultContentFormat: "explainer",
  supportedContentFormats: [...CONTENT_FORMATS],
  supportedAssetTypes: [...ASSET_TYPES],
  approvedVisualSources: [...APPROVED_VISUAL_SOURCES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: VISUAL_RESEARCH_WORKER_IDENTITY.workerId,
  workerName: VISUAL_RESEARCH_WORKER_IDENTITY.workerName,
  factory: VISUAL_RESEARCH_WORKER_IDENTITY.factory,
  department: VISUAL_RESEARCH_WORKER_IDENTITY.department,
  role: VISUAL_RESEARCH_WORKER_IDENTITY.role,
  reportingLine: [...VISUAL_RESEARCH_WORKER_IDENTITY.reportingLine],
  seedVisualResearchReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverGenerateFinalCreativeAssets: true,
  neverEditImages: true,
  neverAssembleVideos: true,
  neverPublishContent: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ409OrLater: true,
  useOnlyApprovedVisualSources: true,
  preserveCompleteAssetTraceability: true,
  preserveCopyrightInformation: true,
  identifyLicensingRestrictions: true,
  detectMissingVisualAssets: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildVisualResearchWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<VisualResearchWorkerConfiguration> = {},
): VisualResearchWorkerConfiguration {
  let file: Partial<VisualResearchWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "visual-research-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.VISUAL_RESEARCH_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.VISUAL_RESEARCH_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (
    key: "integrationTargets" | "supportedContentFormats" | "supportedAssetTypes" | "approvedVisualSources",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_VISUAL_RESEARCH_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_VISUAL_RESEARCH_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedContentFormats: mergeList("supportedContentFormats"),
    supportedAssetTypes: mergeList("supportedAssetTypes"),
    approvedVisualSources: mergeList("approvedVisualSources"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_VISUAL_RESEARCH_WORKER_CONFIGURATION.reportingLine),
    ],
    seedVisualResearchReports: (overrides.seedVisualResearchReports ?? file.seedVisualResearchReports ?? []).map(
      (r) => lockVisualResearchReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverGenerateFinalCreativeAssets: true,
    neverEditImages: true,
    neverAssembleVideos: true,
    neverPublishContent: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ409OrLater: true,
    useOnlyApprovedVisualSources: true,
    preserveCompleteAssetTraceability: true,
    preserveCopyrightInformation: true,
    identifyLicensingRestrictions: true,
    detectMissingVisualAssets: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockVisualResearchReport(report: VisualResearchReport): VisualResearchReport {
  return {
    ...report,
    scenes: report.scenes.map((s) => ({ ...s })),
    missingAssets: [...report.missingAssets],
    licensingRestrictions: report.licensingRestrictions.map((l) => ({ ...l })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || VRW_METADATA_VERSION,
    neverGenerateFinalCreativeAssets: true,
    neverEditImages: true,
    neverAssembleVideos: true,
    neverPublishContent: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ409OrLater: true,
    useOnlyApprovedVisualSources: true,
    preserveCompleteAssetTraceability: true,
    preserveCopyrightInformation: true,
    identifyLicensingRestrictions: true,
    detectMissingVisualAssets: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
