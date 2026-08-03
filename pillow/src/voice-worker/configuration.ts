import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  VOICE_LANGUAGES,
  VOICE_PROFILES,
  VOICE_WORKER_IDENTITY,
  VOW_METADATA_VERSION,
} from "./paths.js";
import type { VoiceReport } from "./types.js";

export type VoiceWorkerConfiguration = {
  enabled: boolean;
  voiceRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultVoiceProfile: string;
  defaultLanguage: string;
  defaultSpeakingSpeed: number;
  supportedVoiceProfiles: string[];
  supportedLanguages: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedVoiceReports: VoiceReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-10 hard boundaries — force-locked true. */
  neverRewriteScripts: true;
  neverAssembleVideos: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ411OrLater: true;
  preserveScriptTraceability: true;
  preserveGeneratedVoiceAssetReferences: true;
  preserveVoiceConfigurationHistory: true;
  validateOutputQuality: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_VOICE_WORKER_CONFIGURATION: VoiceWorkerConfiguration = {
  enabled: true,
  voiceRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultVoiceProfile: "narrator_neutral",
  defaultLanguage: "en-US",
  defaultSpeakingSpeed: 1.0,
  supportedVoiceProfiles: [...VOICE_PROFILES],
  supportedLanguages: [...VOICE_LANGUAGES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: VOICE_WORKER_IDENTITY.workerId,
  workerName: VOICE_WORKER_IDENTITY.workerName,
  factory: VOICE_WORKER_IDENTITY.factory,
  department: VOICE_WORKER_IDENTITY.department,
  role: VOICE_WORKER_IDENTITY.role,
  reportingLine: [...VOICE_WORKER_IDENTITY.reportingLine],
  seedVoiceReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverRewriteScripts: true,
  neverAssembleVideos: true,
  neverPublishMedia: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ411OrLater: true,
  preserveScriptTraceability: true,
  preserveGeneratedVoiceAssetReferences: true,
  preserveVoiceConfigurationHistory: true,
  validateOutputQuality: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildVoiceWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<VoiceWorkerConfiguration> = {},
): VoiceWorkerConfiguration {
  let file: Partial<VoiceWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "voice-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.VOICE_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.VOICE_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (
    key: "integrationTargets" | "supportedVoiceProfiles" | "supportedLanguages",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_VOICE_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_VOICE_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedVoiceProfiles: mergeList("supportedVoiceProfiles"),
    supportedLanguages: mergeList("supportedLanguages"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_VOICE_WORKER_CONFIGURATION.reportingLine),
    ],
    seedVoiceReports: (overrides.seedVoiceReports ?? file.seedVoiceReports ?? []).map((r) =>
      lockVoiceReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverRewriteScripts: true,
    neverAssembleVideos: true,
    neverPublishMedia: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ411OrLater: true,
    preserveScriptTraceability: true,
    preserveGeneratedVoiceAssetReferences: true,
    preserveVoiceConfigurationHistory: true,
    validateOutputQuality: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockVoiceReport(report: VoiceReport): VoiceReport {
  return {
    ...report,
    narrationSegments: report.narrationSegments.map((s) => ({
      ...s,
      pronunciationHints: [...s.pronunciationHints],
    })),
    voiceGenerationSettings: {
      ...report.voiceGenerationSettings,
      pronunciationControls: [...report.voiceGenerationSettings.pronunciationControls],
    },
    voiceAssetReferences: report.voiceAssetReferences.map((a) => ({ ...a })),
    variants: report.variants.map((v) => ({ ...v })),
    configurationHistory: report.configurationHistory.map((c) => ({ ...c })),
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || VOW_METADATA_VERSION,
    neverRewriteScripts: true,
    neverAssembleVideos: true,
    neverPublishMedia: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ411OrLater: true,
    preserveScriptTraceability: true,
    preserveGeneratedVoiceAssetReferences: true,
    preserveVoiceConfigurationHistory: true,
    validateOutputQuality: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
