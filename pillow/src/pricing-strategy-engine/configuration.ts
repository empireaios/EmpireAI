/** X1-09 — Externalized Pricing Strategy Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type PricingStrategyEngineConfiguration = {
  enabled: boolean;
  priceCalculationRulesEnabled: boolean;
  marginRulesEnabled: boolean;
  competitorAnalysisRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverAutoPublish: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxPricingRecordsPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_PRICING_STRATEGY_ENGINE_CONFIGURATION: PricingStrategyEngineConfiguration = {
  enabled: true,
  priceCalculationRulesEnabled: true,
  marginRulesEnabled: true,
  competitorAnalysisRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverExposeCredentials: true,
  neverAutoPublish: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  maxPricingRecordsPerCycle: 12,
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

export function loadPricingStrategyEngineConfigFile(
  repositoryRoot: string,
): Partial<PricingStrategyEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "pricing-strategy-engine.config.json"),
    join(repositoryRoot, "config", "pricing-strategy-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<PricingStrategyEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPricingStrategyEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PricingStrategyEngineConfiguration> = {},
): PricingStrategyEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadPricingStrategyEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<PricingStrategyEngineConfiguration> = {
    enabled: envBool(
      "PRICING_STRATEGY_ENGINE_ENABLED",
      DEFAULT_PRICING_STRATEGY_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "PRICING_STRATEGY_ENGINE_TIMEOUT_MS",
      DEFAULT_PRICING_STRATEGY_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PRICING_STRATEGY_ENGINE_MAX_RETRIES",
      DEFAULT_PRICING_STRATEGY_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "PRICING_STRATEGY_ENGINE_LOG_LEVEL",
      DEFAULT_PRICING_STRATEGY_ENGINE_CONFIGURATION.loggingLevel,
    ) as PricingStrategyEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PRICING_STRATEGY_ENGINE_AUTO_RECOVER",
      DEFAULT_PRICING_STRATEGY_ENGINE_CONFIGURATION.autoRecover,
    ),
    maxPricingRecordsPerCycle: envInt(
      "PRICING_STRATEGY_ENGINE_MAX_RECORDS",
      DEFAULT_PRICING_STRATEGY_ENGINE_CONFIGURATION.maxPricingRecordsPerCycle,
    ),
  };

  return {
    ...DEFAULT_PRICING_STRATEGY_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverAutoPublish: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
