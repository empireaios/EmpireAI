import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EmpireCapitalAllocationConfiguration = {
  enabled: boolean; validationRulesEnabled: boolean; healthMonitoringRulesEnabled: boolean;
  recommendationThreshold: number; maxRetryAttempts: number; retryDelayMs: number; timeoutMs: number; loggingEnabled: boolean;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true; neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance: true;
  preserveAllocationTraceability: true; preserveAuditability: true; preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true; maskSensitiveValues: true; neverLogSensitiveFinancialInformation: true;
};
export const DEFAULT_EMPIRE_CAPITAL_ALLOCATION_CONFIGURATION: EmpireCapitalAllocationConfiguration = {
  enabled: true, validationRulesEnabled: true, healthMonitoringRulesEnabled: true, recommendationThreshold: 55,
  maxRetryAttempts: 3, retryDelayMs: 500, timeoutMs: 5_000, loggingEnabled: true,
  neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance: true,
  preserveAllocationTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveFinancialInformation: true,
};
export function buildEmpireCapitalAllocationConfiguration(repositoryRoot?: string, overrides: Partial<EmpireCapitalAllocationConfiguration> = {}): EmpireCapitalAllocationConfiguration {
  let file: Partial<EmpireCapitalAllocationConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "empire-capital-allocation.config.json") : "";
  if (candidate && existsSync(candidate)) try { file = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* retain doctrine defaults */ }
  return { ...DEFAULT_EMPIRE_CAPITAL_ALLOCATION_CONFIGURATION, ...file, ...overrides,
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance: true,
    preserveAllocationTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveFinancialInformation: true };
}
