import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EmpireMemoryEngineConfiguration = {
  enabled: boolean; validationRulesEnabled: boolean; healthMonitoringRulesEnabled: boolean;
  retentionDays: number; categorizationEnabled: boolean; recommendationThreshold: number;
  maxRetryAttempts: number; retryDelayMs: number; timeoutMs: number; loggingEnabled: boolean;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true;
  neverAlterValidatedHistoricalRecordsWithoutAuthorization: true; preserveHistoricalTraceability: true;
  preserveAuditability: true; preserveEnterpriseIntegrity: true; structuralSignalsOnly: true;
  maskSensitiveValues: true; neverLogSensitiveEnterpriseInformation: true;
};
export const DEFAULT_EMPIRE_MEMORY_ENGINE_CONFIGURATION: EmpireMemoryEngineConfiguration = {
  enabled: true, validationRulesEnabled: true, healthMonitoringRulesEnabled: true, retentionDays: 3650,
  categorizationEnabled: true, recommendationThreshold: 55, maxRetryAttempts: 3, retryDelayMs: 500,
  timeoutMs: 5_000, loggingEnabled: true, neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
  neverAlterValidatedHistoricalRecordsWithoutAuthorization: true, preserveHistoricalTraceability: true,
  preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true,
  maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
};
export function buildEmpireMemoryEngineConfiguration(repositoryRoot?: string, overrides: Partial<EmpireMemoryEngineConfiguration> = {}): EmpireMemoryEngineConfiguration {
  let file: Partial<EmpireMemoryEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "empire-memory-engine.config.json") : "";
  if (candidate && existsSync(candidate)) try { file = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* retain doctrine defaults */ }
  return { ...DEFAULT_EMPIRE_MEMORY_ENGINE_CONFIGURATION, ...file, ...overrides,
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
    neverAlterValidatedHistoricalRecordsWithoutAuthorization: true, preserveHistoricalTraceability: true,
    preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true,
    maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true };
}
