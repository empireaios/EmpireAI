/** R3-13 — Externalized Financial Forecast Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { FORECAST_PERIODS } from "./paths.js";

export type ForecastPeriodRule = {
  period: (typeof FORECAST_PERIODS)[number];
  multiplier: number;
  label: string;
};

export type FinancialForecastEngineConfiguration = {
  enabled: boolean;
  forecastPeriodRulesEnabled: boolean;
  forecastCalculationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  confidenceThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultForecastPeriod: (typeof FORECAST_PERIODS)[number];
  periodRules: ForecastPeriodRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_FINANCIAL_FORECAST_ENGINE_CONFIGURATION: FinancialForecastEngineConfiguration =
  {
    enabled: true,
    forecastPeriodRulesEnabled: true,
    forecastCalculationRulesEnabled: true,
    validationRulesEnabled: true,
    anomalyDetectionEnabled: true,
    confidenceThreshold: 50,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    defaultForecastPeriod: "30d",
    periodRules: [
      { period: "7d", multiplier: 0.25, label: "7-day forecast" },
      { period: "30d", multiplier: 1, label: "30-day forecast" },
      { period: "90d", multiplier: 3, label: "90-day forecast" },
      { period: "quarterly", multiplier: 3, label: "Quarterly forecast" },
      { period: "annual", multiplier: 12, label: "Annual forecast" },
    ],
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

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadFinancialForecastEngineConfigFile(
  repositoryRoot: string,
): Partial<FinancialForecastEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "financial-forecast-engine.config.json"),
    join(repositoryRoot, "config", "financial-forecast-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<FinancialForecastEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildFinancialForecastEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FinancialForecastEngineConfiguration> = {},
): FinancialForecastEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadFinancialForecastEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<FinancialForecastEngineConfiguration> = {
    enabled: envBool(
      "FINANCIAL_FORECAST_ENGINE_ENABLED",
      DEFAULT_FINANCIAL_FORECAST_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "FINANCIAL_FORECAST_ENGINE_TIMEOUT_MS",
      DEFAULT_FINANCIAL_FORECAST_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "FINANCIAL_FORECAST_ENGINE_MAX_RETRIES",
      DEFAULT_FINANCIAL_FORECAST_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    confidenceThreshold: envFloat(
      "FINANCIAL_FORECAST_ENGINE_CONFIDENCE_THRESHOLD",
      DEFAULT_FINANCIAL_FORECAST_ENGINE_CONFIGURATION.confidenceThreshold,
    ),
    loggingLevel: envString(
      "FINANCIAL_FORECAST_ENGINE_LOG_LEVEL",
      DEFAULT_FINANCIAL_FORECAST_ENGINE_CONFIGURATION.loggingLevel,
    ) as FinancialForecastEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "FINANCIAL_FORECAST_ENGINE_AUTO_RECOVER",
      DEFAULT_FINANCIAL_FORECAST_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_FINANCIAL_FORECAST_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
