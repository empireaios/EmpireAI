import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EmpireResilienceEngineConfiguration = {
  enabled: boolean; validationRulesEnabled: boolean; healthMonitoringRulesEnabled: boolean; recommendationThreshold: number;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true; neverExecuteDestructiveRecoveryActionsWithoutApprovedGovernance: true;
  preserveResilienceTraceability: true; preserveAuditability: true; preserveEnterpriseIntegrity: true; structuralSignalsOnly: true; maskSensitiveValues: true; neverLogSensitiveEnterpriseInformation: true;
};
export const DEFAULT_EMPIRE_RESILIENCE_ENGINE_CONFIGURATION: EmpireResilienceEngineConfiguration = {
  enabled: true, validationRulesEnabled: true, healthMonitoringRulesEnabled: true, recommendationThreshold: 55,
  neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverExecuteDestructiveRecoveryActionsWithoutApprovedGovernance: true,
  preserveResilienceTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
};
export function buildEmpireResilienceEngineConfiguration(repositoryRoot?: string, overrides: Partial<EmpireResilienceEngineConfiguration> = {}): EmpireResilienceEngineConfiguration {
  let file: Partial<EmpireResilienceEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "empire-resilience-engine.config.json") : "";
  if (candidate && existsSync(candidate)) try { file = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* retain safe defaults */ }
  return { ...DEFAULT_EMPIRE_RESILIENCE_ENGINE_CONFIGURATION, ...file, ...overrides,
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverExecuteDestructiveRecoveryActionsWithoutApprovedGovernance: true,
    preserveResilienceTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true };
}
