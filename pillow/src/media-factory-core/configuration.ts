import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPROVAL_STATUSES,
  CHANNEL_TYPES,
  CONTENT_STAGES,
  INTEGRATION_TARGETS,
  LEARNING_STATUSES,
  MEDIA_FACTORY_CORE_IDENTITY,
  MFC_METADATA_VERSION,
  MISSION_STATUSES,
  PIPELINE_TYPES,
  PRODUCTION_STATUSES,
  PUBLISHING_STATUSES,
} from "./paths.js";
import type { MediaBusinessMission } from "./types.js";

export type MediaFactoryCoreConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  missionRulesEnabled: boolean;
  lifecycleRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  missionCoordinationEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  channelTypes: string[];
  pipelineTypes: string[];
  contentStages: string[];
  missionStatuses: string[];
  approvalStatuses: string[];
  publishingStatuses: string[];
  learningStatuses: string[];
  productionStatuses: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedMissions: MediaBusinessMission[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q4-01 hard boundaries — force-locked true. */
  neverWriteScripts: true;
  neverGenerateImages: true;
  neverGenerateVideos: true;
  neverPublishDirectly: true;
  neverBypassApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ402OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_MEDIA_FACTORY_CORE_CONFIGURATION: MediaFactoryCoreConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  missionRulesEnabled: true,
  lifecycleRulesEnabled: true,
  executiveReportingEnabled: true,
  missionCoordinationEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  channelTypes: [...CHANNEL_TYPES],
  pipelineTypes: [...PIPELINE_TYPES],
  contentStages: [...CONTENT_STAGES],
  missionStatuses: [...MISSION_STATUSES],
  approvalStatuses: [...APPROVAL_STATUSES],
  publishingStatuses: [...PUBLISHING_STATUSES],
  learningStatuses: [...LEARNING_STATUSES],
  productionStatuses: [...PRODUCTION_STATUSES],
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: MEDIA_FACTORY_CORE_IDENTITY.workerId,
  workerName: MEDIA_FACTORY_CORE_IDENTITY.workerName,
  factory: MEDIA_FACTORY_CORE_IDENTITY.factory,
  department: MEDIA_FACTORY_CORE_IDENTITY.department,
  role: MEDIA_FACTORY_CORE_IDENTITY.role,
  reportingLine: [...MEDIA_FACTORY_CORE_IDENTITY.reportingLine],
  seedMissions: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverWriteScripts: true,
  neverGenerateImages: true,
  neverGenerateVideos: true,
  neverPublishDirectly: true,
  neverBypassApproval: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ402OrLater: true,
  preserveCompleteTraceability: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildMediaFactoryCoreConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MediaFactoryCoreConfiguration> = {},
): MediaFactoryCoreConfiguration {
  let file: Partial<MediaFactoryCoreConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "media-factory-core.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.MEDIA_FACTORY_CORE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.MEDIA_FACTORY_CORE_RETRY_ATTEMPTS ?? "", 10);

  const mergeList = (
    key:
      | "channelTypes"
      | "pipelineTypes"
      | "contentStages"
      | "missionStatuses"
      | "approvalStatuses"
      | "publishingStatuses"
      | "learningStatuses"
      | "productionStatuses"
      | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_MEDIA_FACTORY_CORE_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_MEDIA_FACTORY_CORE_CONFIGURATION,
    ...file,
    ...overrides,
    channelTypes: mergeList("channelTypes"),
    pipelineTypes: mergeList("pipelineTypes"),
    contentStages: mergeList("contentStages"),
    missionStatuses: mergeList("missionStatuses"),
    approvalStatuses: mergeList("approvalStatuses"),
    publishingStatuses: mergeList("publishingStatuses"),
    learningStatuses: mergeList("learningStatuses"),
    productionStatuses: mergeList("productionStatuses"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_MEDIA_FACTORY_CORE_CONFIGURATION.reportingLine),
    ],
    seedMissions: (overrides.seedMissions ?? file.seedMissions ?? []).map((m) => lockMission(m)),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverWriteScripts: true,
    neverGenerateImages: true,
    neverGenerateVideos: true,
    neverPublishDirectly: true,
    neverBypassApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ402OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockMission(mission: MediaBusinessMission): MediaBusinessMission {
  return {
    ...mission,
    assignedWorkers: [...mission.assignedWorkers],
    assignedWorkerRoles: [...mission.assignedWorkerRoles],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
    metadataVersion: mission.metadataVersion || MFC_METADATA_VERSION,
    neverWriteScripts: true,
    neverGenerateImages: true,
    neverGenerateVideos: true,
    neverPublishDirectly: true,
    neverBypassApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ402OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
