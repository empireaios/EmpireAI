import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  TOOL_RUNTIME_IDENTITY,
} from "./paths.js";

export type ToolRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  toolRulesEnabled: boolean;
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
  defaultMaxAttempts: number;
  defaultBackoffMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-07 hard boundaries — force-locked true. */
  neverExposeSecrets: true;
  neverExposeCredentials: true;
  neverFabricateExecutionResults: true;
  neverInvokeUnauthorizedTools: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1008OrLater: true;
  deterministicToolRoutingOnly: true;
  preserveCompleteTraceability: true;
  preserveInvocationTraces: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  credentialReferenceOnly: true;
};

export const DEFAULT_TOOL_RUNTIME_CONFIGURATION: ToolRuntimeConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  toolRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: TOOL_RUNTIME_IDENTITY.workerId,
  workerName: TOOL_RUNTIME_IDENTITY.workerName,
  factory: TOOL_RUNTIME_IDENTITY.factory,
  department: TOOL_RUNTIME_IDENTITY.department,
  role: TOOL_RUNTIME_IDENTITY.role,
  reportingLine: [...TOOL_RUNTIME_IDENTITY.reportingLine],
  defaultMaxAttempts: 3,
  defaultBackoffMs: 100,
  loggingLevel: "info",
  neverExposeSecrets: true,
  neverExposeCredentials: true,
  neverFabricateExecutionResults: true,
  neverInvokeUnauthorizedTools: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1008OrLater: true,
  deterministicToolRoutingOnly: true,
  preserveCompleteTraceability: true,
  preserveInvocationTraces: true,
  preserveAuditHistory: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  credentialReferenceOnly: true,
};

export function buildToolRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ToolRuntimeConfiguration> = {},
): ToolRuntimeConfiguration {
  let file: Partial<ToolRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "tool-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const maxAttempts = Number.parseInt(process.env.TOOL_RUNTIME_DEFAULT_MAX_ATTEMPTS ?? "", 10);
  const backoff = Number.parseInt(process.env.TOOL_RUNTIME_DEFAULT_BACKOFF_MS ?? "", 10);

  const mergeList = () =>
    Array.from(
      new Set([
        ...DEFAULT_TOOL_RUNTIME_CONFIGURATION.integrationTargets,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    );

  return {
    ...DEFAULT_TOOL_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList(),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_TOOL_RUNTIME_CONFIGURATION.reportingLine),
    ],
    ...(Number.isFinite(maxAttempts) ? { defaultMaxAttempts: maxAttempts } : {}),
    ...(Number.isFinite(backoff) ? { defaultBackoffMs: backoff } : {}),
    neverExposeSecrets: true,
    neverExposeCredentials: true,
    neverFabricateExecutionResults: true,
    neverInvokeUnauthorizedTools: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1008OrLater: true,
    deterministicToolRoutingOnly: true,
    preserveCompleteTraceability: true,
    preserveInvocationTraces: true,
    preserveAuditHistory: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    credentialReferenceOnly: true,
  };
}
