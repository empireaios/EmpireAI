import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  MISSION_RUNTIME_IDENTITY,
  MSR_METADATA_VERSION,
} from "./paths.js";

export type MissionRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  lifecycleRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  maxRetries: number;
  defaultTimeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-03 hard boundaries — force-locked true. */
  neverReplaceWorkerLogic: true;
  neverReplaceOrchestrationLogic: true;
  neverExecuteUnauthorisedMissions: true;
  neverFabricateMissionState: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1004OrLater: true;
  preserveCompleteTraceability: true;
  preserveMissionHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  deterministicTransitionsOnly: true;
};

export const DEFAULT_MISSION_RUNTIME_CONFIGURATION: MissionRuntimeConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  lifecycleRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: MISSION_RUNTIME_IDENTITY.workerId,
  workerName: MISSION_RUNTIME_IDENTITY.workerName,
  factory: MISSION_RUNTIME_IDENTITY.factory,
  department: MISSION_RUNTIME_IDENTITY.department,
  role: MISSION_RUNTIME_IDENTITY.role,
  reportingLine: [...MISSION_RUNTIME_IDENTITY.reportingLine],
  maxRetries: 3,
  defaultTimeoutMs: 5000,
  loggingLevel: "info",
  neverReplaceWorkerLogic: true,
  neverReplaceOrchestrationLogic: true,
  neverExecuteUnauthorisedMissions: true,
  neverFabricateMissionState: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1004OrLater: true,
  preserveCompleteTraceability: true,
  preserveMissionHistory: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  deterministicTransitionsOnly: true,
};

export function buildMissionRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MissionRuntimeConfiguration> = {},
): MissionRuntimeConfiguration {
  let file: Partial<MissionRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "mission-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.MISSION_RUNTIME_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.MISSION_RUNTIME_MAX_RETRIES ?? "", 10);

  const mergeList = () =>
    Array.from(
      new Set([
        ...DEFAULT_MISSION_RUNTIME_CONFIGURATION.integrationTargets,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    );

  return {
    ...DEFAULT_MISSION_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList(),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_MISSION_RUNTIME_CONFIGURATION.reportingLine),
    ],
    ...(Number.isFinite(timeout) ? { defaultTimeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { maxRetries: retries } : {}),
    neverReplaceWorkerLogic: true,
    neverReplaceOrchestrationLogic: true,
    neverExecuteUnauthorisedMissions: true,
    neverFabricateMissionState: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1004OrLater: true,
    preserveCompleteTraceability: true,
    preserveMissionHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    deterministicTransitionsOnly: true,
  };
}
