/** X2-03 — Externalized Portfolio Performance Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type PortfolioPerformanceEngineConfiguration = {
  enabled: boolean;
  kpiCalculationRulesEnabled: boolean;
  companyComparisonRulesEnabled: boolean;
  performanceScoringRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverManipulatePerformanceMetrics: true;
  preservePerformanceTraceability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  minOverallScore: number;
  maxCompaniesPerComparison: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_PORTFOLIO_PERFORMANCE_ENGINE_CONFIGURATION: PortfolioPerformanceEngineConfiguration =
  {
    enabled: true,
    kpiCalculationRulesEnabled: true,
    companyComparisonRulesEnabled: true,
    performanceScoringRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverManipulatePerformanceMetrics: true,
    preservePerformanceTraceability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    minOverallScore: 0,
    maxCompaniesPerComparison: 50,
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

export function loadPortfolioPerformanceEngineConfigFile(
  repositoryRoot: string,
): Partial<PortfolioPerformanceEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "portfolio-performance-engine.config.json"),
    join(repositoryRoot, "config", "portfolio-performance-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<PortfolioPerformanceEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPortfolioPerformanceEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PortfolioPerformanceEngineConfiguration> = {},
): PortfolioPerformanceEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadPortfolioPerformanceEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<PortfolioPerformanceEngineConfiguration> = {
    enabled: envBool(
      "PORTFOLIO_PERFORMANCE_ENGINE_ENABLED",
      DEFAULT_PORTFOLIO_PERFORMANCE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "PORTFOLIO_PERFORMANCE_ENGINE_TIMEOUT_MS",
      DEFAULT_PORTFOLIO_PERFORMANCE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PORTFOLIO_PERFORMANCE_ENGINE_MAX_RETRIES",
      DEFAULT_PORTFOLIO_PERFORMANCE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "PORTFOLIO_PERFORMANCE_ENGINE_LOG_LEVEL",
      DEFAULT_PORTFOLIO_PERFORMANCE_ENGINE_CONFIGURATION.loggingLevel,
    ) as PortfolioPerformanceEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PORTFOLIO_PERFORMANCE_ENGINE_AUTO_RECOVER",
      DEFAULT_PORTFOLIO_PERFORMANCE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PORTFOLIO_PERFORMANCE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverManipulatePerformanceMetrics: true,
    preservePerformanceTraceability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
