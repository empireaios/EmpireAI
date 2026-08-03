import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type CrossRegionLearningEngineConfiguration = {
  enabled: boolean; validationRulesEnabled: boolean; healthMonitoringRulesEnabled: boolean;
  knowledgeValueThreshold: number; maxRetryAttempts: number; retryDelayMs: number;
  neverExposeCredentials: true; neverExposeAuthenticationTokens: true;
  neverDistributeUnvalidatedOperationalKnowledge: true; preserveLearningTraceability: true;
  preserveAuditability: true; preserveEnterpriseIntegrity: true; structuralSignalsOnly: true;
  maskSensitiveValues: true; neverLogSensitiveEnterpriseInformation: true;
};
export const DEFAULT_CROSS_REGION_LEARNING_ENGINE_CONFIGURATION: CrossRegionLearningEngineConfiguration = {
  enabled: true, validationRulesEnabled: true, healthMonitoringRulesEnabled: true,
  knowledgeValueThreshold: 55, maxRetryAttempts: 3, retryDelayMs: 500,
  neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
  neverDistributeUnvalidatedOperationalKnowledge: true, preserveLearningTraceability: true,
  preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true,
  maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
};
export function buildCrossRegionLearningEngineConfiguration(repositoryRoot?: string, overrides: Partial<CrossRegionLearningEngineConfiguration> = {}): CrossRegionLearningEngineConfiguration {
  let file: Partial<CrossRegionLearningEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "cross-region-learning-engine.config.json") : "";
  if (candidate && existsSync(candidate)) try { file = JSON.parse(readFileSync(candidate, "utf8")); } catch { /* use defaults */ }
  return {
    ...DEFAULT_CROSS_REGION_LEARNING_ENGINE_CONFIGURATION, ...file, ...overrides,
    neverExposeCredentials: true, neverExposeAuthenticationTokens: true,
    neverDistributeUnvalidatedOperationalKnowledge: true, preserveLearningTraceability: true,
    preserveAuditability: true, preserveEnterpriseIntegrity: true, structuralSignalsOnly: true,
    maskSensitiveValues: true, neverLogSensitiveEnterpriseInformation: true,
  };
}
