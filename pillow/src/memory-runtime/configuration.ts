import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTEGRATION_TARGETS,
  MEMORY_RUNTIME_IDENTITY,
  MEMRT_METADATA_VERSION,
} from "./paths.js";

export type MemoryRuntimeConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  memoryRulesEnabled: boolean;
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
  defaultTimeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q10-05 hard boundaries — force-locked true. */
  neverReplaceEkls: true;
  neverReplaceApplicationDatabases: true;
  neverModifyHistoricalRecords: true;
  neverFabricateMemory: true;
  neverSilentlyOverwriteHistoricalDecisions: true;
  neverBypassPillowGovernance: true;
  neverBypassGrandKingApproval: true;
  neverOverrideApprovedArchitecture: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ1006OrLater: true;
  preserveCompleteTraceability: true;
  preserveHistoricalMemory: true;
  preserveAuditHistory: true;
  neverExposeCredentials: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
  deterministicRetrievalOnly: true;
};

export const DEFAULT_MEMORY_RUNTIME_CONFIGURATION: MemoryRuntimeConfiguration = {
  enabled: true,
  validationRulesEnabled: true,
  memoryRulesEnabled: true,
  executiveReportingEnabled: true,
  requireGrandKingApproval: true,
  requirePillowCommandConfirmation: true,
  integrationTargets: [...INTEGRATION_TARGETS],
  workerId: MEMORY_RUNTIME_IDENTITY.workerId,
  workerName: MEMORY_RUNTIME_IDENTITY.workerName,
  factory: MEMORY_RUNTIME_IDENTITY.factory,
  department: MEMORY_RUNTIME_IDENTITY.department,
  role: MEMORY_RUNTIME_IDENTITY.role,
  reportingLine: [...MEMORY_RUNTIME_IDENTITY.reportingLine],
  defaultTimeoutMs: 5000,
  loggingLevel: "info",
  neverReplaceEkls: true,
  neverReplaceApplicationDatabases: true,
  neverModifyHistoricalRecords: true,
  neverFabricateMemory: true,
  neverSilentlyOverwriteHistoricalDecisions: true,
  neverBypassPillowGovernance: true,
  neverBypassGrandKingApproval: true,
  neverOverrideApprovedArchitecture: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverImplementQ1006OrLater: true,
  preserveCompleteTraceability: true,
  preserveHistoricalMemory: true,
  preserveAuditHistory: true,
  neverExposeCredentials: true,
  structuralSignalOnly: true,
  maskSensitiveValues: true,
  deterministicRetrievalOnly: true,
};

export function buildMemoryRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MemoryRuntimeConfiguration> = {},
): MemoryRuntimeConfiguration {
  let file: Partial<MemoryRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "memory-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.MEMORY_RUNTIME_TIMEOUT_MS ?? "", 10);

  const mergeList = () =>
    Array.from(
      new Set([
        ...DEFAULT_MEMORY_RUNTIME_CONFIGURATION.integrationTargets,
        ...(file.integrationTargets ?? []),
        ...(overrides.integrationTargets ?? []),
      ]),
    );

  return {
    ...DEFAULT_MEMORY_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    integrationTargets: mergeList(),
    reportingLine: [
      ...(overrides.reportingLine ??
        file.reportingLine ??
        DEFAULT_MEMORY_RUNTIME_CONFIGURATION.reportingLine),
    ],
    ...(Number.isFinite(timeout) ? { defaultTimeoutMs: timeout } : {}),
    neverReplaceEkls: true,
    neverReplaceApplicationDatabases: true,
    neverModifyHistoricalRecords: true,
    neverFabricateMemory: true,
    neverSilentlyOverwriteHistoricalDecisions: true,
    neverBypassPillowGovernance: true,
    neverBypassGrandKingApproval: true,
    neverOverrideApprovedArchitecture: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverImplementQ1006OrLater: true,
    preserveCompleteTraceability: true,
    preserveHistoricalMemory: true,
    preserveAuditHistory: true,
    neverExposeCredentials: true,
    structuralSignalOnly: true,
    maskSensitiveValues: true,
    deterministicRetrievalOnly: true,
  };
}
