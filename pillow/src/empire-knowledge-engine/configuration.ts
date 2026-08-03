import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type EmpireKnowledgeEngineConfiguration = {
  enabled: boolean; validationRulesEnabled: boolean; healthMonitoringRulesEnabled: boolean;
  recommendationThreshold: number; maxRetryAttempts: number; retryDelayMs: number;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true;
  neverDistributeUnvalidatedEnterpriseKnowledge: true; preserveKnowledgeTraceability: true;
  preserveAuditability: true; preserveEnterpriseIntegrity: true; structuralSignalsOnly: true;
  maskSensitiveValues: true; neverLogSensitiveEnterpriseInformation: true;
};
export const DEFAULT_EMPIRE_KNOWLEDGE_ENGINE_CONFIGURATION: EmpireKnowledgeEngineConfiguration = {
  enabled: true, validationRulesEnabled: true, healthMonitoringRulesEnabled: true,
  recommendationThreshold: 55, maxRetryAttempts: 3, retryDelayMs: 500,
  neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
  neverDistributeUnvalidatedEnterpriseKnowledge: true, preserveKnowledgeTraceability: true,
  preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true,
  maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
};
export function buildEmpireKnowledgeEngineConfiguration(repositoryRoot?: string, overrides: Partial<EmpireKnowledgeEngineConfiguration> = {}): EmpireKnowledgeEngineConfiguration {
  let file: Partial<EmpireKnowledgeEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "empire-knowledge-engine.config.json") : "";
  if (candidate && existsSync(candidate)) try { file = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* defaults retain doctrine */ }
  return { ...DEFAULT_EMPIRE_KNOWLEDGE_ENGINE_CONFIGURATION, ...file, ...overrides,
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
    neverDistributeUnvalidatedEnterpriseKnowledge: true, preserveKnowledgeTraceability: true,
    preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true,
    maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true };
}
