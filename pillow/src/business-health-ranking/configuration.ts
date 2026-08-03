/** X2-09 — Externalized Business Health Ranking configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type BusinessHealthRankingConfiguration = {
  enabled: boolean;
  healthScoringRulesEnabled: boolean;
  rankingRulesEnabled: boolean;
  priorityThresholdsEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverManipulateBusinessRankings: true;
  preserveRankingTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  decliningThreshold: number;
  highPerformerThreshold: number;
  criticalPriorityThreshold: number;
  highPriorityThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_BUSINESS_HEALTH_RANKING_CONFIGURATION: BusinessHealthRankingConfiguration =
  {
    enabled: true,
    healthScoringRulesEnabled: true,
    rankingRulesEnabled: true,
    priorityThresholdsEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverManipulateBusinessRankings: true,
    preserveRankingTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    decliningThreshold: 45,
    highPerformerThreshold: 75,
    criticalPriorityThreshold: 40,
    highPriorityThreshold: 55,
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

export function loadBusinessHealthRankingConfigFile(
  repositoryRoot: string,
): Partial<BusinessHealthRankingConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "business-health-ranking.config.json"),
    join(repositoryRoot, "config", "business-health-ranking.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<BusinessHealthRankingConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildBusinessHealthRankingConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BusinessHealthRankingConfiguration> = {},
): BusinessHealthRankingConfiguration {
  const fileConfig = repositoryRoot
    ? loadBusinessHealthRankingConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<BusinessHealthRankingConfiguration> = {
    enabled: envBool(
      "BUSINESS_HEALTH_RANKING_ENABLED",
      DEFAULT_BUSINESS_HEALTH_RANKING_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "BUSINESS_HEALTH_RANKING_TIMEOUT_MS",
      DEFAULT_BUSINESS_HEALTH_RANKING_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "BUSINESS_HEALTH_RANKING_MAX_RETRIES",
      DEFAULT_BUSINESS_HEALTH_RANKING_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "BUSINESS_HEALTH_RANKING_LOG_LEVEL",
      DEFAULT_BUSINESS_HEALTH_RANKING_CONFIGURATION.loggingLevel,
    ) as BusinessHealthRankingConfiguration["loggingLevel"],
    autoRecover: envBool(
      "BUSINESS_HEALTH_RANKING_AUTO_RECOVER",
      DEFAULT_BUSINESS_HEALTH_RANKING_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_BUSINESS_HEALTH_RANKING_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverManipulateBusinessRankings: true,
    preserveRankingTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
