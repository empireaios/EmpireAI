/** X1-03 — Externalized Market Validation Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type MarketValidationEngineConfiguration = {
  enabled: boolean;
  validationRulesEnabled: boolean;
  marketScoringRulesEnabled: boolean;
  investmentRecommendationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverFabricateValidationResults: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  minMarketDemandScore: number;
  minCompetitionScore: number;
  minProfitabilityScore: number;
  minValidationConfidence: number;
  proceedThreshold: number;
  cautionThreshold: number;
  maxValidationsPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION: MarketValidationEngineConfiguration =
  {
    enabled: true,
    validationRulesEnabled: true,
    marketScoringRulesEnabled: true,
    investmentRecommendationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverFabricateValidationResults: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    minMarketDemandScore: 50,
    minCompetitionScore: 40,
    minProfitabilityScore: 50,
    minValidationConfidence: 55,
    proceedThreshold: 75,
    cautionThreshold: 55,
    maxValidationsPerCycle: 12,
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

export function loadMarketValidationEngineConfigFile(
  repositoryRoot: string,
): Partial<MarketValidationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "market-validation-engine.config.json"),
    join(repositoryRoot, "config", "market-validation-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<MarketValidationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMarketValidationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MarketValidationEngineConfiguration> = {},
): MarketValidationEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadMarketValidationEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<MarketValidationEngineConfiguration> = {
    enabled: envBool(
      "MARKET_VALIDATION_ENGINE_ENABLED",
      DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "MARKET_VALIDATION_ENGINE_TIMEOUT_MS",
      DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "MARKET_VALIDATION_ENGINE_MAX_RETRIES",
      DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "MARKET_VALIDATION_ENGINE_LOG_LEVEL",
      DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as MarketValidationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MARKET_VALIDATION_ENGINE_AUTO_RECOVER",
      DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION.autoRecover,
    ),
    minMarketDemandScore: envInt(
      "MARKET_VALIDATION_ENGINE_MIN_DEMAND",
      DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION.minMarketDemandScore,
    ),
    minValidationConfidence: envInt(
      "MARKET_VALIDATION_ENGINE_MIN_CONFIDENCE",
      DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION.minValidationConfidence,
    ),
    proceedThreshold: envInt(
      "MARKET_VALIDATION_ENGINE_PROCEED_THRESHOLD",
      DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION.proceedThreshold,
    ),
    maxValidationsPerCycle: envInt(
      "MARKET_VALIDATION_ENGINE_MAX_VALIDATIONS",
      DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION.maxValidationsPerCycle,
    ),
  };

  return {
    ...DEFAULT_MARKET_VALIDATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverFabricateValidationResults: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
