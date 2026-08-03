/** X4-09 — Externalized Global Market Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type GlobalMarketIntelligenceConfiguration = {
  enabled: boolean;
  marketMonitoringRulesEnabled: boolean;
  opportunityRankingRulesEnabled: boolean;
  trendAnalysisRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverRecommendWithUnvalidatedIntelligence: true;
  preserveMarketTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_GLOBAL_MARKET_INTELLIGENCE_CONFIGURATION: GlobalMarketIntelligenceConfiguration =
  {
    enabled: true,
    marketMonitoringRulesEnabled: true,
    opportunityRankingRulesEnabled: true,
    trendAnalysisRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendWithUnvalidatedIntelligence: true,
    preserveMarketTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
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

export function loadGlobalMarketIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<GlobalMarketIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "global-market-intelligence.config.json"),
    join(repositoryRoot, "config", "global-market-intelligence.config.json"),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      return JSON.parse(
        readFileSync(candidate, "utf8"),
      ) as Partial<GlobalMarketIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildGlobalMarketIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<GlobalMarketIntelligenceConfiguration> = {},
): GlobalMarketIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadGlobalMarketIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<GlobalMarketIntelligenceConfiguration> = {
    enabled: envBool(
      "GLOBAL_MARKET_INTELLIGENCE_ENABLED",
      DEFAULT_GLOBAL_MARKET_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "GLOBAL_MARKET_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_GLOBAL_MARKET_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "GLOBAL_MARKET_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_GLOBAL_MARKET_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "GLOBAL_MARKET_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_GLOBAL_MARKET_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as GlobalMarketIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "GLOBAL_MARKET_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_GLOBAL_MARKET_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_GLOBAL_MARKET_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendWithUnvalidatedIntelligence: true,
    preserveMarketTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
