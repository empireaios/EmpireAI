import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SCHEDULING_RUNTIME_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";

export type SchedulingRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  schedulingRulesEnabled: boolean;
  executiveReportingEnabled: boolean;
  requireGrandKingApproval: boolean;
  requirePillowCommandConfirmation: boolean;
  defaultMaxRetries: number;
  defaultBackoffMs: number;
  integrationTargets: string[];
  workerId: string;
  workerName: string;
  factory: string;
  department: string;
  role: string;
  reportingLine: string[];
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-12 hard boundaries — force-locked true. */
  neverFabricateExecutionTimes: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverReplaceQueueRuntime: true;
  neverReplaceMissionRuntime: true;
  neverExecuteUnauthorizedWork: true;
  neverImplementQ1013OrLater: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  preserveCompleteTraceability: true;
  preserveSchedulingHistory: true;
  preserveAuditHistory: true;
  deterministicSchedulingBehaviour: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_SCHEDULING_RUNTIME_CONFIGURATION: SchedulingRuntimeConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  schedulingRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  defaultMaxRetries: 3,
  defaultBackoffMs: 1000,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: SCHEDULING_RUNTIME_IDENTITY.workerId,
  workerName: SCHEDULING_RUNTIME_IDENTITY.workerName,
  factory: SCHEDULING_RUNTIME_IDENTITY.factory,
  department: SCHEDULING_RUNTIME_IDENTITY.department,
  role: SCHEDULING_RUNTIME_IDENTITY.role,
  reportingLine: [...SCHEDULING_RUNTIME_IDENTITY.reportingLine],
  loggingLevel: "info",
  neverFabricateExecutionTimes: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverReplaceQueueRuntime: true,
  neverReplaceMissionRuntime: true,
  neverExecuteUnauthorizedWork: true,
  neverImplementQ1013OrLater: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  preserveCompleteTraceability: true,
  preserveSchedulingHistory: true,
  preserveAuditHistory: true,
  deterministicSchedulingBehaviour: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildSchedulingRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SchedulingRuntimeConfiguration> = {},
): SchedulingRuntimeConfiguration {
  let file: Partial<SchedulingRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "scheduling-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }

  const mergeList = () =>
    Array.from(
      new Set([
        ...DEFAULT_SCHEDULING_RUNTIME_CONFIGURATION.integrationTargets,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    );

  return {
    ...DEFAULT_SCHEDULING_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList(),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_SCHEDULING_RUNTIME_CONFIGURATION.reportingLine),
    ],
    neverFabricateExecutionTimes: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverReplaceQueueRuntime: true,
    neverReplaceMissionRuntime: true,
    neverExecuteUnauthorizedWork: true,
    neverImplementQ1013OrLater: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    preserveCompleteTraceability: true,
    preserveSchedulingHistory: true,
    preserveAuditHistory: true,
    deterministicSchedulingBehaviour: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
