import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type GlobalExpansionSimulatorConfiguration = {
  enabled: boolean; validationRulesEnabled: boolean; healthMonitoringRulesEnabled: boolean;
  minimumRecommendationScore: number; maxRetryAttempts: number; retryDelayMs: number;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true;
  neverExecuteSimulatedActionsAgainstProductionSystems: true; preserveSimulationTraceability: true;
  preserveAuditability: true; preserveEnterpriseIntegrity: true; structuralSignalsOnly: true;
  maskSensitiveValues: true; neverLogSensitiveEnterpriseInformation: true;
  neverOptimizeOrExecuteUsingUnvalidatedSimulationIntelligence: true;
};
export const DEFAULT_GLOBAL_EXPANSION_SIMULATOR_CONFIGURATION: GlobalExpansionSimulatorConfiguration = {
  enabled: true, validationRulesEnabled: true, healthMonitoringRulesEnabled: true,
  minimumRecommendationScore: 55, maxRetryAttempts: 3, retryDelayMs: 500,
  neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
  neverExecuteSimulatedActionsAgainstProductionSystems: true, preserveSimulationTraceability: true,
  preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true,
  maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
  neverOptimizeOrExecuteUsingUnvalidatedSimulationIntelligence: true,
};
export function buildGlobalExpansionSimulatorConfiguration(repositoryRoot?: string, overrides: Partial<GlobalExpansionSimulatorConfiguration> = {}): GlobalExpansionSimulatorConfiguration {
  let file: Partial<GlobalExpansionSimulatorConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "global-expansion-simulator.config.json") : "";
  if (candidate && existsSync(candidate)) try { file = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* defaults remain authoritative */ }
  return {
    ...DEFAULT_GLOBAL_EXPANSION_SIMULATOR_CONFIGURATION, ...file, ...overrides,
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
    neverExecuteSimulatedActionsAgainstProductionSystems: true, preserveSimulationTraceability: true,
    preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true,
    maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
    neverOptimizeOrExecuteUsingUnvalidatedSimulationIntelligence: true,
  };
}
