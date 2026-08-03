import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  AUDIO_ASSET_TYPES,
  INTEGRATION_TARGETS,
  MUSIC_MOODS,
  MUSIC_SOUND_WORKER_IDENTITY,
  MSW_METADATA_VERSION,
} from "./paths.js";
import type { MusicSoundReport } from "./types.js";

export type MusicSoundWorkerConfiguration = {
  enabled: boolean;
  audioRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  defaultMood: string;
  allowGeneratedMusicByDefault: boolean;
  supportedAudioTypes: string[];
  supportedMoods: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedAudioReports: MusicSoundReport[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-13 hard boundaries — force-locked true. */
  neverAssembleVideos: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ414OrLater: true;
  neverUseUnapprovedCopyrightedAssets: true;
  preserveCompleteAssetTraceability: true;
  preserveLicensingInformation: true;
  preserveTimelineSynchronization: true;
  validateCopyrightCompliance: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_MUSIC_SOUND_WORKER_CONFIGURATION: MusicSoundWorkerConfiguration = {
  enabled: true,
  audioRulesEnabled: true,
  validationRulesEnabled: true,
  executiveReportingEnabled: true,
  defaultMood: "curious",
  allowGeneratedMusicByDefault: true,
  supportedAudioTypes: [...AUDIO_ASSET_TYPES],
  supportedMoods: [...MUSIC_MOODS],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: MUSIC_SOUND_WORKER_IDENTITY.workerId,
  workerName: MUSIC_SOUND_WORKER_IDENTITY.workerName,
  factory: MUSIC_SOUND_WORKER_IDENTITY.factory,
  department: MUSIC_SOUND_WORKER_IDENTITY.department,
  role: MUSIC_SOUND_WORKER_IDENTITY.role,
  reportingLine: [...MUSIC_SOUND_WORKER_IDENTITY.reportingLine],
  seedAudioReports: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverAssembleVideos: true,
  neverPublishMedia: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ414OrLater: true,
  neverUseUnapprovedCopyrightedAssets: true,
  preserveCompleteAssetTraceability: true,
  preserveLicensingInformation: true,
  preserveTimelineSynchronization: true,
  validateCopyrightCompliance: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildMusicSoundWorkerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MusicSoundWorkerConfiguration> = {},
): MusicSoundWorkerConfiguration {
  let file: Partial<MusicSoundWorkerConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "music-sound-worker.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.MUSIC_SOUND_WORKER_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.MUSIC_SOUND_WORKER_RETRY_ATTEMPTS ?? "", 10);
  const mergeList = (key: "integrationTargets" | "supportedAudioTypes" | "supportedMoods") =>
    Array.from(
      new Set([
        ...DEFAULT_MUSIC_SOUND_WORKER_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );
  return {
    ...DEFAULT_MUSIC_SOUND_WORKER_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList("integrationTargets"),
    supportedAudioTypes: mergeList("supportedAudioTypes"),
    supportedMoods: mergeList("supportedMoods"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_MUSIC_SOUND_WORKER_CONFIGURATION.reportingLine),
    ],
    seedAudioReports: (overrides.seedAudioReports ?? file.seedAudioReports ?? []).map((r) =>
      lockAudioReport(r),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverAssembleVideos: true,
    neverPublishMedia: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ414OrLater: true,
    neverUseUnapprovedCopyrightedAssets: true,
    preserveCompleteAssetTraceability: true,
    preserveLicensingInformation: true,
    preserveTimelineSynchronization: true,
    validateCopyrightCompliance: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockAudioReport(report: MusicSoundReport): MusicSoundReport {
  return {
    ...report,
    backgroundMusicAssets: report.backgroundMusicAssets.map((a) => ({ ...a })),
    soundEffectAssets: report.soundEffectAssets.map((a) => ({ ...a })),
    sceneTimeline: report.sceneTimeline.map((s) => ({
      ...s,
      soundEffectAssetIds: [...s.soundEffectAssetIds],
    })),
    audioPlacement: report.audioPlacement.map((p) => ({ ...p })),
    qualityValidation: { ...report.qualityValidation },
    requiredSoundEffects: [...report.requiredSoundEffects],
    traceabilityRefs: [...report.traceabilityRefs],
    preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    metadataVersion: report.metadataVersion || MSW_METADATA_VERSION,
    neverAssembleVideos: true,
    neverPublishMedia: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ414OrLater: true,
    neverUseUnapprovedCopyrightedAssets: true,
    preserveCompleteAssetTraceability: true,
    preserveLicensingInformation: true,
    preserveTimelineSynchronization: true,
    validateCopyrightCompliance: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
