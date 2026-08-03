import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EmpireSelfImprovementEngineConfiguration = {
  enabled: boolean; validationRulesEnabled: boolean; healthMonitoringRulesEnabled: boolean; recommendationThreshold: number;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true; neverModifyGovernanceApprovedArchitectureAutomatically: true; neverBypassConstitutionalGovernance: true;
  preserveImprovementTraceability: true; preserveAuditability: true; preserveEnterpriseIntegrity: true; structuralSignalsOnly: true; maskSensitiveValues: true; neverLogSensitiveEnterpriseInformation: true;
};
export const DEFAULT_EMPIRE_SELF_IMPROVEMENT_ENGINE_CONFIGURATION: EmpireSelfImprovementEngineConfiguration = {
  enabled: true, validationRulesEnabled: true, healthMonitoringRulesEnabled: true, recommendationThreshold: 55,
  neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverModifyGovernanceApprovedArchitectureAutomatically: true, neverBypassConstitutionalGovernance: true,
  preserveImprovementTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
};
export function buildEmpireSelfImprovementEngineConfiguration(repositoryRoot?: string, overrides: Partial<EmpireSelfImprovementEngineConfiguration> = {}): EmpireSelfImprovementEngineConfiguration {
  let file: Partial<EmpireSelfImprovementEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "empire-self-improvement-engine.config.json") : "";
  if (candidate && existsSync(candidate)) try { file = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* retain safe defaults */ }
  return { ...DEFAULT_EMPIRE_SELF_IMPROVEMENT_ENGINE_CONFIGURATION, ...file, ...overrides,
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true, neverModifyGovernanceApprovedArchitectureAutomatically: true, neverBypassConstitutionalGovernance: true,
    preserveImprovementTraceability: true, preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true, maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true };
}
