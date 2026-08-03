/** X2-04 — Externalized Cross-Business Knowledge Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CrossBusinessKnowledgeEngineConfiguration = {
  enabled: boolean;
  knowledgeCollectionRulesEnabled: boolean;
  knowledgeSharingRulesEnabled: boolean;
  knowledgeRankingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverShareConfidentialWithoutValidation: true;
  preserveKnowledgeTraceability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  minReusabilityScore: number;
  minConfidenceScore: number;
  maxKnowledgeRecords: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_CROSS_BUSINESS_KNOWLEDGE_ENGINE_CONFIGURATION: CrossBusinessKnowledgeEngineConfiguration =
  {
    enabled: true,
    knowledgeCollectionRulesEnabled: true,
    knowledgeSharingRulesEnabled: true,
    knowledgeRankingRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverShareConfidentialWithoutValidation: true,
    preserveKnowledgeTraceability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    minReusabilityScore: 40,
    minConfidenceScore: 45,
    maxKnowledgeRecords: 500,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
  };

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadCrossBusinessKnowledgeEngineConfigFile(
  repositoryRoot: string,
): Partial<CrossBusinessKnowledgeEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "cross-business-knowledge-engine.config.json"),
    join(repositoryRoot, "config", "cross-business-knowledge-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CrossBusinessKnowledgeEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCrossBusinessKnowledgeEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CrossBusinessKnowledgeEngineConfiguration> = {},
): CrossBusinessKnowledgeEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadCrossBusinessKnowledgeEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CrossBusinessKnowledgeEngineConfiguration> = {
    enabled: envBool(
      "CROSS_BUSINESS_KNOWLEDGE_ENGINE_ENABLED",
      DEFAULT_CROSS_BUSINESS_KNOWLEDGE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CROSS_BUSINESS_KNOWLEDGE_ENGINE_TIMEOUT_MS",
      DEFAULT_CROSS_BUSINESS_KNOWLEDGE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CROSS_BUSINESS_KNOWLEDGE_ENGINE_MAX_RETRIES",
      DEFAULT_CROSS_BUSINESS_KNOWLEDGE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "CROSS_BUSINESS_KNOWLEDGE_ENGINE_LOG_LEVEL",
      DEFAULT_CROSS_BUSINESS_KNOWLEDGE_ENGINE_CONFIGURATION.loggingLevel,
    ) as CrossBusinessKnowledgeEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CROSS_BUSINESS_KNOWLEDGE_ENGINE_AUTO_RECOVER",
      DEFAULT_CROSS_BUSINESS_KNOWLEDGE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CROSS_BUSINESS_KNOWLEDGE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverShareConfidentialWithoutValidation: true,
    preserveKnowledgeTraceability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
