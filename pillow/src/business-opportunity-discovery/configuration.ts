/** X1-02 — Externalized Business Opportunity Discovery configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type BusinessOpportunityDiscoveryConfiguration = {
  enabled: boolean;
  marketMonitoringRulesEnabled: boolean;
  opportunityScoringRulesEnabled: boolean;
  rankingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverFabricateMarketInformation: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  minOpportunityScore: number;
  minConfidenceScore: number;
  maxOpportunitiesPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_BUSINESS_OPPORTUNITY_DISCOVERY_CONFIGURATION: BusinessOpportunityDiscoveryConfiguration =
  {
    enabled: true,
    marketMonitoringRulesEnabled: true,
    opportunityScoringRulesEnabled: true,
    rankingRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverFabricateMarketInformation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    minOpportunityScore: 50,
    minConfidenceScore: 55,
    maxOpportunitiesPerCycle: 12,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
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

export function loadBusinessOpportunityDiscoveryConfigFile(
  repositoryRoot: string,
): Partial<BusinessOpportunityDiscoveryConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "business-opportunity-discovery.config.json"),
    join(repositoryRoot, "config", "business-opportunity-discovery.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<BusinessOpportunityDiscoveryConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildBusinessOpportunityDiscoveryConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BusinessOpportunityDiscoveryConfiguration> = {},
): BusinessOpportunityDiscoveryConfiguration {
  const fileConfig = repositoryRoot
    ? loadBusinessOpportunityDiscoveryConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<BusinessOpportunityDiscoveryConfiguration> = {
    enabled: envBool(
      "BUSINESS_OPPORTUNITY_DISCOVERY_ENABLED",
      DEFAULT_BUSINESS_OPPORTUNITY_DISCOVERY_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "BUSINESS_OPPORTUNITY_DISCOVERY_TIMEOUT_MS",
      DEFAULT_BUSINESS_OPPORTUNITY_DISCOVERY_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "BUSINESS_OPPORTUNITY_DISCOVERY_MAX_RETRIES",
      DEFAULT_BUSINESS_OPPORTUNITY_DISCOVERY_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "BUSINESS_OPPORTUNITY_DISCOVERY_LOG_LEVEL",
      DEFAULT_BUSINESS_OPPORTUNITY_DISCOVERY_CONFIGURATION.loggingLevel,
    ) as BusinessOpportunityDiscoveryConfiguration["loggingLevel"],
    autoRecover: envBool(
      "BUSINESS_OPPORTUNITY_DISCOVERY_AUTO_RECOVER",
      DEFAULT_BUSINESS_OPPORTUNITY_DISCOVERY_CONFIGURATION.autoRecover,
    ),
    minOpportunityScore: envInt(
      "BUSINESS_OPPORTUNITY_DISCOVERY_MIN_SCORE",
      DEFAULT_BUSINESS_OPPORTUNITY_DISCOVERY_CONFIGURATION.minOpportunityScore,
    ),
    minConfidenceScore: envInt(
      "BUSINESS_OPPORTUNITY_DISCOVERY_MIN_CONFIDENCE",
      DEFAULT_BUSINESS_OPPORTUNITY_DISCOVERY_CONFIGURATION.minConfidenceScore,
    ),
    maxOpportunitiesPerCycle: envInt(
      "BUSINESS_OPPORTUNITY_DISCOVERY_MAX_OPPORTUNITIES",
      DEFAULT_BUSINESS_OPPORTUNITY_DISCOVERY_CONFIGURATION.maxOpportunitiesPerCycle,
    ),
  };

  return {
    ...DEFAULT_BUSINESS_OPPORTUNITY_DISCOVERY_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverFabricateMarketInformation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
