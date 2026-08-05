import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  QUEUE_RUNTIME_IDENTITY,
  QRT_METADATA_VERSION,
} from "./paths.js";

export type QueueRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  queueRulesEnabled: boolean;
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
  defaultMaxRetries: number;
  defaultTimeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-04 hard boundaries — force-locked true. */
  neverReplaceWorkerLogic: true;
  neverReplaceMissionLogic: true;
  neverExecuteBusinessSpecificWork: true;
  neverFabricateQueueState: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1005OrLater: true;
  preserveCompleteTraceability: true;
  preserveExecutionHistory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  deterministicQueueOrdering: true;
};

export const DEFAULT_QUEUE_RUNTIME_CONFIGURATION: QueueRuntimeConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  queueRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: QUEUE_RUNTIME_IDENTITY.workerId,
  workerName: QUEUE_RUNTIME_IDENTITY.workerName,
  factory: QUEUE_RUNTIME_IDENTITY.factory,
  department: QUEUE_RUNTIME_IDENTITY.department,
  role: QUEUE_RUNTIME_IDENTITY.role,
  reportingLine: [...QUEUE_RUNTIME_IDENTITY.reportingLine],
  defaultMaxRetries: 3,
  defaultTimeoutMs: 5000,
  loggingLevel: "info",
  neverReplaceWorkerLogic: true,
  neverReplaceMissionLogic: true,
  neverExecuteBusinessSpecificWork: true,
  neverFabricateQueueState: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1005OrLater: true,
  preserveCompleteTraceability: true,
  preserveExecutionHistory: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  deterministicQueueOrdering: true,
};

export function buildQueueRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<QueueRuntimeConfiguration> = {},
): QueueRuntimeConfiguration {
  let file: Partial<QueueRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "queue-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.QUEUE_RUNTIME_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.QUEUE_RUNTIME_DEFAULT_MAX_RETRIES ?? "", 10);

  const mergeList = () =>
    Array.from(
      new Set([
        ...DEFAULT_QUEUE_RUNTIME_CONFIGURATION.integrationTargets,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    );

  return {
    ...DEFAULT_QUEUE_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList(),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_QUEUE_RUNTIME_CONFIGURATION.reportingLine),
    ],
    ...(Number.isFinite(timeout) ? { defaultTimeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { defaultMaxRetries: retries } : {}),
    neverReplaceWorkerLogic: true,
    neverReplaceMissionLogic: true,
    neverExecuteBusinessSpecificWork: true,
    neverFabricateQueueState: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1005OrLater: true,
    preserveCompleteTraceability: true,
    preserveExecutionHistory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    deterministicQueueOrdering: true,
  };
}
