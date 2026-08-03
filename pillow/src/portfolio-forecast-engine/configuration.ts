/** X2-14 — Externalized Portfolio Forecast Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type PortfolioForecastEngineConfiguration = {
  enabled: boolean;
  forecastCalculationRulesEnabled: boolean;
  scenarioGenerationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverPresentForecastsAsGuaranteedOutcomes: true;
  preserveForecastTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
  defaultForecastPeriod: "30d" | "90d" | "180d" | "365d";
  minimumConfidenceThreshold: number;
  highConfidenceThreshold: number;
  baselineRevenueGrowthRate: number;
  baselineProfitMargin: number;
  baselineCompanyGrowthRate: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_PORTFOLIO_FORECAST_ENGINE_CONFIGURATION: PortfolioForecastEngineConfiguration =
  {
    enabled: true,
    forecastCalculationRulesEnabled: true,
    scenarioGenerationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverPresentForecastsAsGuaranteedOutcomes: true,
    preserveForecastTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
    defaultForecastPeriod: "90d",
    minimumConfidenceThreshold: 40,
    highConfidenceThreshold: 75,
    baselineRevenueGrowthRate: 8,
    baselineProfitMargin: 18,
    baselineCompanyGrowthRate: 6,
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

export function loadPortfolioForecastEngineConfigFile(
  repositoryRoot: string,
): Partial<PortfolioForecastEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "portfolio-forecast-engine.config.json"),
    join(repositoryRoot, "config", "portfolio-forecast-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<PortfolioForecastEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPortfolioForecastEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PortfolioForecastEngineConfiguration> = {},
): PortfolioForecastEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadPortfolioForecastEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<PortfolioForecastEngineConfiguration> = {
    enabled: envBool(
      "PORTFOLIO_FORECAST_ENGINE_ENABLED",
      DEFAULT_PORTFOLIO_FORECAST_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "PORTFOLIO_FORECAST_ENGINE_TIMEOUT_MS",
      DEFAULT_PORTFOLIO_FORECAST_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PORTFOLIO_FORECAST_ENGINE_MAX_RETRIES",
      DEFAULT_PORTFOLIO_FORECAST_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    minimumConfidenceThreshold: envInt(
      "PORTFOLIO_FORECAST_ENGINE_MIN_CONFIDENCE",
      DEFAULT_PORTFOLIO_FORECAST_ENGINE_CONFIGURATION.minimumConfidenceThreshold,
    ),
    loggingLevel: envString(
      "PORTFOLIO_FORECAST_ENGINE_LOG_LEVEL",
      DEFAULT_PORTFOLIO_FORECAST_ENGINE_CONFIGURATION.loggingLevel,
    ) as PortfolioForecastEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PORTFOLIO_FORECAST_ENGINE_AUTO_RECOVER",
      DEFAULT_PORTFOLIO_FORECAST_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PORTFOLIO_FORECAST_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverPresentForecastsAsGuaranteedOutcomes: true,
    preserveForecastTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
