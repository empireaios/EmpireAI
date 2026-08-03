import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EmpireInnovationEngineConfiguration = {
  enabled: boolean; validationRulesEnabled: boolean; healthMonitoringRulesEnabled: boolean;
  recommendationThreshold: number; maxRetryAttempts: number; retryDelayMs: number; timeoutMs: number; loggingEnabled: boolean;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true; neverPromoteUnvalidatedInnovationsIntoProductionAutomatically: true;
  preserveInnovationTraceability: true; preserveAuditability: true; preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true; maskSensitiveValues: true; neverLogSensitiveEnterpriseInformation: true;
};
export const DEFAULT_EMPIRE_INNOVATION_ENGINE_CONFIGURATION: EmpireInnovationEngineConfiguration = {
  enabled: true, validationRulesEnabled: true, healthMonitoringRulesEnabled: true, recommendationThreshold: 55,
  maxRetryAttempts: 3, retryDelayMs: 500, timeoutMs: 5_000, loggingEnabled: true,
  neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverPromoteUnvalidatedInnovationsIntoProductionAutomatically: true,
  preserveInnovationTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
};
export function buildEmpireInnovationEngineConfiguration(repositoryRoot?: string, overrides: Partial<EmpireInnovationEngineConfiguration> = {}): EmpireInnovationEngineConfiguration {
  let file: Partial<EmpireInnovationEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "empire-innovation-engine.config.json") : "";
  if (candidate && existsSync(candidate)) try { file = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* retain doctrine defaults */ }
  return { ...DEFAULT_EMPIRE_INNOVATION_ENGINE_CONFIGURATION, ...file, ...overrides,
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverPromoteUnvalidatedInnovationsIntoProductionAutomatically: true,
    preserveInnovationTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true };
}
