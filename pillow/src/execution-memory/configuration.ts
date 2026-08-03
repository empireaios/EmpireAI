import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type ExecutionMemoryConfiguration = {
  enabled: boolean;
  recordingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRecords: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-04 hard boundaries — force-locked true. */
  neverMakeDecisions: true;
  neverPlanMissions: true;
  neverAssignWorkers: true;
  neverExecuteWork: true;
  neverReplaceKnowledgeSystems: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveMemoryTraceability: true;
  preserveAuditability: true;
  preserveMemoryIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_EXECUTION_MEMORY_CONFIGURATION: ExecutionMemoryConfiguration = {
  enabled: true,
  recordingRulesEnabled: true,
  validationRulesEnabled: true,
  maxRecords: 10_000,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverMakeDecisions: true,
  neverPlanMissions: true,
  neverAssignWorkers: true,
  neverExecuteWork: true,
  neverReplaceKnowledgeSystems: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveMemoryTraceability: true,
  preserveAuditability: true,
  preserveMemoryIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildExecutionMemoryConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutionMemoryConfiguration> = {},
): ExecutionMemoryConfiguration {
  let file: Partial<ExecutionMemoryConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "execution-memory.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.EXECUTION_MEMORY_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.EXECUTION_MEMORY_RETRY_ATTEMPTS ?? "", 10);
  const maxRecords = Number.parseInt(process.env.EXECUTION_MEMORY_MAX_RECORDS ?? "", 10);
  return {
    ...DEFAULT_EXECUTION_MEMORY_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(maxRecords) ? { maxRecords } : {}),
    neverMakeDecisions: true,
    neverPlanMissions: true,
    neverAssignWorkers: true,
    neverExecuteWork: true,
    neverReplaceKnowledgeSystems: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveMemoryTraceability: true,
    preserveAuditability: true,
    preserveMemoryIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
