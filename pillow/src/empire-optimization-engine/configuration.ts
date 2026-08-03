import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EmpireOptimizationEngineConfiguration = {
  enabled: boolean; validationRulesEnabled: boolean; healthMonitoringRulesEnabled: boolean;
  recommendationThreshold: number; maxRetryAttempts: number; retryDelayMs: number; timeoutMs: number; loggingEnabled: boolean;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true; neverExecuteUnapprovedOptimizationActionsAutomatically: true;
  preserveOptimizationTraceability: true; preserveAuditability: true; preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true; maskSensitiveValues: true; neverLogSensitiveEnterpriseInformation: true;
};
export const DEFAULT_EMPIRE_OPTIMIZATION_ENGINE_CONFIGURATION: EmpireOptimizationEngineConfiguration = {
  enabled: true, validationRulesEnabled: true, healthMonitoringRulesEnabled: true, recommendationThreshold: 55,
  maxRetryAttempts: 3, retryDelayMs: 500, timeoutMs: 5_000, loggingEnabled: true,
  neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverExecuteUnapprovedOptimizationActionsAutomatically: true,
  preserveOptimizationTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
};
export function buildEmpireOptimizationEngineConfiguration(repositoryRoot?: string, overrides: Partial<EmpireOptimizationEngineConfiguration> = {}): EmpireOptimizationEngineConfiguration {
  let file: Partial<EmpireOptimizationEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "empire-optimization-engine.config.json") : "";
  if (candidate && existsSync(candidate)) try { file = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* retain doctrine defaults */ }
  return { ...DEFAULT_EMPIRE_OPTIMIZATION_ENGINE_CONFIGURATION, ...file, ...overrides,
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverExecuteUnapprovedOptimizationActionsAutomatically: true,
    preserveOptimizationTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true };
}
