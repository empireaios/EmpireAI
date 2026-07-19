/** R3-12 — Externalized Multi-Currency Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SUPPORTED_CURRENCY_CODES } from "./paths.js";

export type MultiCurrencyEngineConfiguration = {
  enabled: boolean;
  exchangeRateProviderRulesEnabled: boolean;
  conversionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  exchangeRateRefreshFrequencyMs: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  reportingCurrency: string;
  supportedCurrencies: string[];
  maskSensitiveValues: true;
};

export const DEFAULT_MULTI_CURRENCY_ENGINE_CONFIGURATION: MultiCurrencyEngineConfiguration = {
  enabled: true,
  exchangeRateProviderRulesEnabled: true,
  conversionRulesEnabled: true,
  validationRulesEnabled: true,
  anomalyDetectionEnabled: true,
  exchangeRateRefreshFrequencyMs: 3600000,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  reportingCurrency: "USD",
  supportedCurrencies: [...SUPPORTED_CURRENCY_CODES],
  maskSensitiveValues: true,
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

export function loadMultiCurrencyEngineConfigFile(
  repositoryRoot: string,
): Partial<MultiCurrencyEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "multi-currency-engine.config.json"),
    join(repositoryRoot, "config", "multi-currency-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<MultiCurrencyEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMultiCurrencyEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MultiCurrencyEngineConfiguration> = {},
): MultiCurrencyEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadMultiCurrencyEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<MultiCurrencyEngineConfiguration> = {
    enabled: envBool(
      "MULTI_CURRENCY_ENGINE_ENABLED",
      DEFAULT_MULTI_CURRENCY_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "MULTI_CURRENCY_ENGINE_TIMEOUT_MS",
      DEFAULT_MULTI_CURRENCY_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "MULTI_CURRENCY_ENGINE_MAX_RETRIES",
      DEFAULT_MULTI_CURRENCY_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    exchangeRateRefreshFrequencyMs: envInt(
      "MULTI_CURRENCY_ENGINE_RATE_REFRESH_MS",
      DEFAULT_MULTI_CURRENCY_ENGINE_CONFIGURATION.exchangeRateRefreshFrequencyMs,
    ),
    loggingLevel: envString(
      "MULTI_CURRENCY_ENGINE_LOG_LEVEL",
      DEFAULT_MULTI_CURRENCY_ENGINE_CONFIGURATION.loggingLevel,
    ) as MultiCurrencyEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MULTI_CURRENCY_ENGINE_AUTO_RECOVER",
      DEFAULT_MULTI_CURRENCY_ENGINE_CONFIGURATION.autoRecover,
    ),
    reportingCurrency: envString(
      "MULTI_CURRENCY_ENGINE_REPORTING_CURRENCY",
      DEFAULT_MULTI_CURRENCY_ENGINE_CONFIGURATION.reportingCurrency,
    ),
  };

  return {
    ...DEFAULT_MULTI_CURRENCY_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
