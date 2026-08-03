/** X3-16 — Externalized Revenue Acceleration Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type RevenueAccelerationEngineConfiguration = {
  enabled: boolean;
  accelerationRulesEnabled: boolean;
  revenueGrowthMonitoringEnabled: boolean;
  revenueTrendMonitoringEnabled: boolean;
  productRevenueMonitoringEnabled: boolean;
  channelRevenueMonitoringEnabled: boolean;
  customerRevenueMonitoringEnabled: boolean;
  revenueOpportunityIdentificationEnabled: boolean;
  revenueBottleneckIdentificationEnabled: boolean;
  revenueStrategyOptimizationEnabled: boolean;
  revenueOpportunityRankingEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverRecommendRevenueActionsWithoutValidatedSupportingData: true;
  preserveRevenueTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveFinancialInformation: true;
  revenueOpportunityThreshold: number;
  highOpportunityThreshold: number;
  criticalOpportunityThreshold: number;
  revenueGrowthThreshold: number;
  revenueTrendThreshold: number;
  productRevenueThreshold: number;
  channelRevenueThreshold: number;
  customerRevenueThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_REVENUE_ACCELERATION_ENGINE_CONFIGURATION: RevenueAccelerationEngineConfiguration =
  {
    enabled: true,
    accelerationRulesEnabled: true,
    revenueGrowthMonitoringEnabled: true,
    revenueTrendMonitoringEnabled: true,
    productRevenueMonitoringEnabled: true,
    channelRevenueMonitoringEnabled: true,
    customerRevenueMonitoringEnabled: true,
    revenueOpportunityIdentificationEnabled: true,
    revenueBottleneckIdentificationEnabled: true,
    revenueStrategyOptimizationEnabled: true,
    revenueOpportunityRankingEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendRevenueActionsWithoutValidatedSupportingData: true,
    preserveRevenueTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveFinancialInformation: true,
    revenueOpportunityThreshold: 55,
    highOpportunityThreshold: 70,
    criticalOpportunityThreshold: 85,
    revenueGrowthThreshold: 60,
    revenueTrendThreshold: 60,
    productRevenueThreshold: 60,
    channelRevenueThreshold: 60,
    customerRevenueThreshold: 60,
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

export function loadRevenueAccelerationEngineConfigFile(
  repositoryRoot: string,
): Partial<RevenueAccelerationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "revenue-acceleration-engine.config.json"),
    join(repositoryRoot, "config", "revenue-acceleration-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<RevenueAccelerationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildRevenueAccelerationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RevenueAccelerationEngineConfiguration> = {},
): RevenueAccelerationEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadRevenueAccelerationEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<RevenueAccelerationEngineConfiguration> = {
    enabled: envBool(
      "REVENUE_ACCELERATION_ENGINE_ENABLED",
      DEFAULT_REVENUE_ACCELERATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "REVENUE_ACCELERATION_ENGINE_TIMEOUT_MS",
      DEFAULT_REVENUE_ACCELERATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "REVENUE_ACCELERATION_ENGINE_MAX_RETRIES",
      DEFAULT_REVENUE_ACCELERATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    revenueOpportunityThreshold: envInt(
      "REVENUE_ACCELERATION_ENGINE_OPPORTUNITY_THRESHOLD",
      DEFAULT_REVENUE_ACCELERATION_ENGINE_CONFIGURATION.revenueOpportunityThreshold,
    ),
    highOpportunityThreshold: envInt(
      "REVENUE_ACCELERATION_ENGINE_HIGH_OPPORTUNITY",
      DEFAULT_REVENUE_ACCELERATION_ENGINE_CONFIGURATION.highOpportunityThreshold,
    ),
    criticalOpportunityThreshold: envInt(
      "REVENUE_ACCELERATION_ENGINE_CRITICAL_OPPORTUNITY",
      DEFAULT_REVENUE_ACCELERATION_ENGINE_CONFIGURATION.criticalOpportunityThreshold,
    ),
    loggingLevel: envString(
      "REVENUE_ACCELERATION_ENGINE_LOG_LEVEL",
      DEFAULT_REVENUE_ACCELERATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as RevenueAccelerationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "REVENUE_ACCELERATION_ENGINE_AUTO_RECOVER",
      DEFAULT_REVENUE_ACCELERATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_REVENUE_ACCELERATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendRevenueActionsWithoutValidatedSupportingData: true,
    preserveRevenueTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveFinancialInformation: true,
  };
}
