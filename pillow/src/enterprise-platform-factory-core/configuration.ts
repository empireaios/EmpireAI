import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  APPROVAL_STATUSES,
  DEPLOYMENT_STATUSES,
  ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY,
  EPFC_METADATA_VERSION,
  INTEGRATION_TARGETS,
  LIFECYCLE_STAGES,
  MISSION_STATUSES,
  PIPELINE_STAGES,
  PIPELINE_TYPES,
  PLATFORM_TYPES,
  PRODUCTION_STATUSES,
  TESTING_STATUSES,
} from "./paths.js";
import type { EnterprisePlatformMission } from "./types.js";

export type EnterprisePlatformFactoryCoreConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  missionRulesEnabled: boolean;
  lifecycleRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  missionCoordinationEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  platformTypes: string[];
  pipelineTypes: string[];
  pipelineStages: string[];
  lifecycleStages: string[];
  missionStatuses: string[];
  approvalStatuses: string[];
  testingStatuses: string[];
  deploymentStatuses: string[];
  productionStatuses: string[];
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  seedMissions: EnterprisePlatformMission[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q6-01 hard boundaries — force-locked true. */
  neverBuildFrontend: true;
  neverBuildBackend: true;
  neverDesignDatabases: true;
  neverBypassGrandKingApproval: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ602OrLater: true;
  preserveCompleteTraceability: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_ENTERPRISE_PLATFORM_FACTORY_CORE_CONFIGURATION: EnterprisePlatformFactoryCoreConfiguration =
  {
    enabled: true,
    validationRulesEnabled: true,
    missionRulesEnabled: true,
    lifecycleRulesEnabled: true,
    executiveReportingEnabled: true,
    missionCoordinationEnabled: true,
    requireGrandKingApproval: true,
    requirePillowCommandConfirmation: true,
    platformTypes: [...PLATFORM_TYPES],
    pipelineTypes: [...PIPELINE_TYPES],
    pipelineStages: [...PIPELINE_STAGES],
    lifecycleStages: [...LIFECYCLE_STAGES],
    missionStatuses: [...MISSION_STATUSES],
    approvalStatuses: [...APPROVAL_STATUSES],
    testingStatuses: [...TESTING_STATUSES],
    deploymentStatuses: [...DEPLOYMENT_STATUSES],
    productionStatuses: [...PRODUCTION_STATUSES],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.workerId,
    workerName: ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.workerName,
    factory: ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.factory,
    department: ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.department,
    role: ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.role,
    reportingLine: [...ENTERPRISE_PLATFORM_FACTORY_CORE_IDENTITY.reportingLine],
    seedMissions: [],
    retryPolicyAttempts: 3,
    timeoutMs: 5000,
    loggingLevel: "info",
    neverBuildFrontend: true,
    neverBuildBackend: true,
    neverDesignDatabases: true,
    neverBypassGrandKingApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ602OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };

export function buildEnterprisePlatformFactoryCoreConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EnterprisePlatformFactoryCoreConfiguration> = {},
): EnterprisePlatformFactoryCoreConfiguration {
  let file: Partial<EnterprisePlatformFactoryCoreConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "enterprise-platform-factory-core.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(
    process.env.ENTERPRISE_PLATFORM_FACTORY_CORE_TIMEOUT_MS ?? "",
    10,
  );
  const retries = Number.parseInt(
    process.env.ENTERPRISE_PLATFORM_FACTORY_CORE_RETRY_ATTEMPTS ?? "",
    10,
  );

  const mergeList = (
    key:
      | "platformTypes"
      | "pipelineTypes"
      | "pipelineStages"
      | "lifecycleStages"
      | "missionStatuses"
      | "approvalStatuses"
      | "testingStatuses"
      | "deploymentStatuses"
      | "productionStatuses"
      | "integrationTargets",
  ) =>
    Array.from(
      new Set([
        ...DEFAULT_ENTERPRISE_PLATFORM_FACTORY_CORE_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_ENTERPRISE_PLATFORM_FACTORY_CORE_CONFIGURATION,
    ...file,
    ...overrides,
    platformTypes: mergeList("platformTypes"),
    pipelineTypes: mergeList("pipelineTypes"),
    pipelineStages: mergeList("pipelineStages"),
    lifecycleStages: mergeList("lifecycleStages"),
    missionStatuses: mergeList("missionStatuses"),
    approvalStatuses: mergeList("approvalStatuses"),
    testingStatuses: mergeList("testingStatuses"),
    deploymentStatuses: mergeList("deploymentStatuses"),
    productionStatuses: mergeList("productionStatuses"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_ENTERPRISE_PLATFORM_FACTORY_CORE_CONFIGURATION.reportingLine),
    ],
    seedMissions: (overrides.seedMissions ?? file.seedMissions ?? []).map((m) =>
      lockMission(m),
    ),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverBuildFrontend: true,
    neverBuildBackend: true,
    neverDesignDatabases: true,
    neverBypassGrandKingApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ602OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

function lockMission(mission: EnterprisePlatformMission): EnterprisePlatformMission {
  return {
    ...mission,
    platformPortfolio: [...mission.platformPortfolio],
    activePlatforms: [...mission.activePlatforms],
    assignedWorkers: [...mission.assignedWorkers],
    assignedWorkerRoles: [...mission.assignedWorkerRoles],
    activeDependencies: [...mission.activeDependencies],
    preservedDecisions: [...mission.preservedDecisions],
    traceabilityRefs: [...mission.traceabilityRefs],
    metadataVersion: mission.metadataVersion || EPFC_METADATA_VERSION,
    neverBuildFrontend: true,
    neverBuildBackend: true,
    neverDesignDatabases: true,
    neverBypassGrandKingApproval: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ602OrLater: true,
    preserveCompleteTraceability: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
