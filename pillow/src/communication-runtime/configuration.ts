import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  COMMUNICATION_RUNTIME_IDENTITY,
  INTEGRATION_TARGETS,
} from "./paths.js";

export type CommunicationRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  communicationRulesEnabled: boolean;
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
  defaultBackoffMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-08 hard boundaries — force-locked true. */
  neverFabricateMessages: true;
  neverLoseAcknowledgedMessages: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverImplementQ1009OrLater: true;
  neverExecuteBusinessLogic: true;
  neverReplaceWorkerImplementations: true;
  neverReplaceOrchestrationLogic: true;
  deterministicMessageRouting: true;
  preserveCompleteTraceability: true;
  preserveCommunicationHistory: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export const DEFAULT_COMMUNICATION_RUNTIME_CONFIGURATION: CommunicationRuntimeConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  communicationRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: COMMUNICATION_RUNTIME_IDENTITY.workerId,
  workerName: COMMUNICATION_RUNTIME_IDENTITY.workerName,
  factory: COMMUNICATION_RUNTIME_IDENTITY.factory,
  department: COMMUNICATION_RUNTIME_IDENTITY.department,
  role: COMMUNICATION_RUNTIME_IDENTITY.role,
  reportingLine: [...COMMUNICATION_RUNTIME_IDENTITY.reportingLine],
  defaultMaxRetries: 3,
  defaultBackoffMs: 100,
  loggingLevel: "info",
  neverFabricateMessages: true,
  neverLoseAcknowledgedMessages: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverImplementQ1009OrLater: true,
  neverExecuteBusinessLogic: true,
  neverReplaceWorkerImplementations: true,
  neverReplaceOrchestrationLogic: true,
  deterministicMessageRouting: true,
  preserveCompleteTraceability: true,
  preserveCommunicationHistory: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
};

export function buildCommunicationRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CommunicationRuntimeConfiguration> = {},
): CommunicationRuntimeConfiguration {
  let file: Partial<CommunicationRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "communication-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const maxRetries = Number.parseInt(process.env.COMMUNICATION_RUNTIME_DEFAULT_MAX_RETRIES ?? "", 10);
  const backoff = Number.parseInt(process.env.COMMUNICATION_RUNTIME_DEFAULT_BACKOFF_MS ?? "", 10);

  const mergeList = () =>
    Array.from(
      new Set([
        ...DEFAULT_COMMUNICATION_RUNTIME_CONFIGURATION.integrationTargets,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    );

  return {
    ...DEFAULT_COMMUNICATION_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList(),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_COMMUNICATION_RUNTIME_CONFIGURATION.reportingLine),
    ],
    ...(Number.isFinite(maxRetries) ? { defaultMaxRetries: maxRetries } : {}),
    ...(Number.isFinite(backoff) ? { defaultBackoffMs: backoff } : {}),
    neverFabricateMessages: true,
    neverLoseAcknowledgedMessages: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverImplementQ1009OrLater: true,
    neverExecuteBusinessLogic: true,
    neverReplaceWorkerImplementations: true,
    neverReplaceOrchestrationLogic: true,
    deterministicMessageRouting: true,
    preserveCompleteTraceability: true,
    preserveCommunicationHistory: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
  };
}
