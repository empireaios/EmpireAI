import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type CivilizationKnowledgeEngineConfiguration = {
  enabled: boolean;
  externalKnowledgeAcquisitionRulesEnabled: boolean;
  knowledgeRankingRulesEnabled: boolean;
  strategicRelevanceThreshold: number;
  validationRulesEnabled: boolean;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverIntegrateUnvalidatedExternalKnowledgeIntoEnterpriseDecisionMakingAutomatically: true;
  preserveKnowledgeTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_CIVILIZATION_KNOWLEDGE_ENGINE_CONFIGURATION: CivilizationKnowledgeEngineConfiguration = {
  enabled: true,
  externalKnowledgeAcquisitionRulesEnabled: true,
  knowledgeRankingRulesEnabled: true,
  strategicRelevanceThreshold: 55,
  validationRulesEnabled: true,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverIntegrateUnvalidatedExternalKnowledgeIntoEnterpriseDecisionMakingAutomatically: true,
  preserveKnowledgeTraceability: true,
  preserveAuditability: true,
  preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildCivilizationKnowledgeEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CivilizationKnowledgeEngineConfiguration> = {},
): CivilizationKnowledgeEngineConfiguration {
  let file: Partial<CivilizationKnowledgeEngineConfiguration> = {};
  const candidate = repositoryRoot ? join(repositoryRoot, "config", "civilization-knowledge-engine.config.json") : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.CIVILIZATION_KNOWLEDGE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.CIVILIZATION_KNOWLEDGE_RETRY_ATTEMPTS ?? "", 10);
  const threshold = Number.parseInt(process.env.CIVILIZATION_KNOWLEDGE_RELEVANCE_THRESHOLD ?? "", 10);
  return {
    ...DEFAULT_CIVILIZATION_KNOWLEDGE_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    ...(Number.isFinite(threshold) ? { strategicRelevanceThreshold: threshold } : {}),
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverIntegrateUnvalidatedExternalKnowledgeIntoEnterpriseDecisionMakingAutomatically: true,
    preserveKnowledgeTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
