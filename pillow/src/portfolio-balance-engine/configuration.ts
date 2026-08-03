/** X2-08 — Externalized Portfolio Balance Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type PortfolioBalanceEngineConfiguration = {
  enabled: boolean;
  diversificationRulesEnabled: boolean;
  concentrationThresholdsEnabled: boolean;
  optimizationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverAutoRebalanceBeyondApprovalPolicy: true;
  preserveOptimizationTraceability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxIndustryConcentrationPercent: number;
  maxRevenueConcentrationPercent: number;
  maxCapitalConcentrationPercent: number;
  minDiversificationScore: number;
  imbalanceAlertThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_PORTFOLIO_BALANCE_ENGINE_CONFIGURATION: PortfolioBalanceEngineConfiguration =
  {
    enabled: true,
    diversificationRulesEnabled: true,
    concentrationThresholdsEnabled: true,
    optimizationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverAutoRebalanceBeyondApprovalPolicy: true,
    preserveOptimizationTraceability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    maxIndustryConcentrationPercent: 50,
    maxRevenueConcentrationPercent: 45,
    maxCapitalConcentrationPercent: 40,
    minDiversificationScore: 55,
    imbalanceAlertThreshold: 60,
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

export function loadPortfolioBalanceEngineConfigFile(
  repositoryRoot: string,
): Partial<PortfolioBalanceEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "portfolio-balance-engine.config.json"),
    join(repositoryRoot, "config", "portfolio-balance-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<PortfolioBalanceEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPortfolioBalanceEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PortfolioBalanceEngineConfiguration> = {},
): PortfolioBalanceEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadPortfolioBalanceEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<PortfolioBalanceEngineConfiguration> = {
    enabled: envBool(
      "PORTFOLIO_BALANCE_ENGINE_ENABLED",
      DEFAULT_PORTFOLIO_BALANCE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "PORTFOLIO_BALANCE_ENGINE_TIMEOUT_MS",
      DEFAULT_PORTFOLIO_BALANCE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PORTFOLIO_BALANCE_ENGINE_MAX_RETRIES",
      DEFAULT_PORTFOLIO_BALANCE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "PORTFOLIO_BALANCE_ENGINE_LOG_LEVEL",
      DEFAULT_PORTFOLIO_BALANCE_ENGINE_CONFIGURATION.loggingLevel,
    ) as PortfolioBalanceEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PORTFOLIO_BALANCE_ENGINE_AUTO_RECOVER",
      DEFAULT_PORTFOLIO_BALANCE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PORTFOLIO_BALANCE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverAutoRebalanceBeyondApprovalPolicy: true,
    preserveOptimizationTraceability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
