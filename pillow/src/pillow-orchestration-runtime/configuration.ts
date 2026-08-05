import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  ORCHESTRATION_SERVICES,
  PILLOW_ORCHESTRATION_RUNTIME_IDENTITY,
  POR_METADATA_VERSION,
} from "./paths.js";

export type PillowOrchestrationRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  orchestrationRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  orchestrationServices: string[];
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
  /** Q10-02 hard boundaries — force-locked true. */
  neverReplaceWorkerImplementations: true;
  neverReplaceToolImplementations: true;
  neverExecuteUnauthorisedActions: true;
  neverFabricateExecutionResults: true;
  neverBypassApprovalRuntime: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1003OrLater: true;
  preserveCompleteTraceability: true;
  preserveOrchestrationHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_PILLOW_ORCHESTRATION_RUNTIME_CONFIGURATION: PillowOrchestrationRuntimeConfiguration =
  {
    enabled: true,
    validationRulesEnabled: true,
    orchestrationRulesEnabled: true,
    executiveReportingEnabled: true,
    requireGrandKingApproval: true,
    requirePillowCommandConfirmation: true,
    orchestrationServices: [...ORCHESTRATION_SERVICES],
    integrationTargets: [...INTEGRATION_TARGETS],
    workerId: PILLOW_ORCHESTRATION_RUNTIME_IDENTITY.workerId,
    workerName: PILLOW_ORCHESTRATION_RUNTIME_IDENTITY.workerName,
    factory: PILLOW_ORCHESTRATION_RUNTIME_IDENTITY.factory,
    department: PILLOW_ORCHESTRATION_RUNTIME_IDENTITY.department,
    role: PILLOW_ORCHESTRATION_RUNTIME_IDENTITY.role,
    reportingLine: [...PILLOW_ORCHESTRATION_RUNTIME_IDENTITY.reportingLine],
    maxRetries: 3,
    defaultTimeoutMs: 5000,
    loggingLevel: "info",
    neverReplaceWorkerImplementations: true,
    neverReplaceToolImplementations: true,
    neverExecuteUnauthorisedActions: true,
    neverFabricateExecutionResults: true,
    neverBypassApprovalRuntime: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1003OrLater: true,
    preserveCompleteTraceability: true,
    preserveOrchestrationHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };

export function buildPillowOrchestrationRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PillowOrchestrationRuntimeConfiguration> = {},
): PillowOrchestrationRuntimeConfiguration {
  let file: Partial<PillowOrchestrationRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "pillow-orchestration-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PILLOW_ORCHESTRATION_RUNTIME_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.PILLOW_ORCHESTRATION_RUNTIME_MAX_RETRIES ?? "", 10);

  const mergeList = (key: "orchestrationServices" | "integrationTargets") =>
    Array.from(
      new Set([
        ...DEFAULT_PILLOW_ORCHESTRATION_RUNTIME_CONFIGURATION[key],
        ...(file[key] ?? []),
        ...(overrides[key] ?? []),
      ]),
    );

  return {
    ...DEFAULT_PILLOW_ORCHESTRATION_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    orchestrationServices: mergeList("orchestrationServices"),
    integrationTargets: mergeList("integrationTargets"),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_PILLOW_ORCHESTRATION_RUNTIME_CONFIGURATION.reportingLine),
    ],
    ...(Number.isFinite(timeout) ? { defaultTimeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { maxRetries: retries } : {}),
    neverReplaceWorkerImplementations: true,
    neverReplaceToolImplementations: true,
    neverExecuteUnauthorisedActions: true,
    neverFabricateExecutionResults: true,
    neverBypassApprovalRuntime: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1003OrLater: true,
    preserveCompleteTraceability: true,
    preserveOrchestrationHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
