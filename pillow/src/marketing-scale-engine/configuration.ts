/** X3-05 — Externalized Marketing Scale Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type MarketingScaleEngineConfiguration = {
  enabled: boolean;
  monitoringRulesEnabled: boolean;
  campaignEvaluationRulesEnabled: boolean;
  scalingThresholdsEnabled: boolean;
  marketingOptimizationRulesEnabled: boolean;
  bottleneckDetectionEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverRecommendMarketingExpansionWithoutValidatedPerformance: true;
  preserveMarketingTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveMarketingInformation: true;
  maxCacThreshold: number;
  minRoasThreshold: number;
  minConversionThreshold: number;
  minScalingReadinessScore: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION: MarketingScaleEngineConfiguration =
  {
    enabled: true,
    monitoringRulesEnabled: true,
    campaignEvaluationRulesEnabled: true,
    scalingThresholdsEnabled: true,
    marketingOptimizationRulesEnabled: true,
    bottleneckDetectionEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendMarketingExpansionWithoutValidatedPerformance: true,
    preserveMarketingTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveMarketingInformation: true,
    maxCacThreshold: 50,
    minRoasThreshold: 150,
    minConversionThreshold: 2,
    minScalingReadinessScore: 55,
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

export function loadMarketingScaleEngineConfigFile(
  repositoryRoot: string,
): Partial<MarketingScaleEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "marketing-scale-engine.config.json"),
    join(repositoryRoot, "config", "marketing-scale-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<MarketingScaleEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMarketingScaleEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MarketingScaleEngineConfiguration> = {},
): MarketingScaleEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadMarketingScaleEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<MarketingScaleEngineConfiguration> = {
    enabled: envBool(
      "MARKETING_SCALE_ENGINE_ENABLED",
      DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "MARKETING_SCALE_ENGINE_TIMEOUT_MS",
      DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "MARKETING_SCALE_ENGINE_MAX_RETRIES",
      DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    maxCacThreshold: envInt(
      "MARKETING_SCALE_ENGINE_MAX_CAC",
      DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION.maxCacThreshold,
    ),
    minRoasThreshold: envInt(
      "MARKETING_SCALE_ENGINE_MIN_ROAS",
      DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION.minRoasThreshold,
    ),
    minConversionThreshold: envInt(
      "MARKETING_SCALE_ENGINE_MIN_CONVERSION",
      DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION.minConversionThreshold,
    ),
    minScalingReadinessScore: envInt(
      "MARKETING_SCALE_ENGINE_MIN_READINESS",
      DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION.minScalingReadinessScore,
    ),
    loggingLevel: envString(
      "MARKETING_SCALE_ENGINE_LOG_LEVEL",
      DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION.loggingLevel,
    ) as MarketingScaleEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MARKETING_SCALE_ENGINE_AUTO_RECOVER",
      DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_MARKETING_SCALE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendMarketingExpansionWithoutValidatedPerformance: true,
    preserveMarketingTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveMarketingInformation: true,
  };
}
