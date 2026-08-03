/** X1-14 — Externalized First Revenue Optimizer configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type FirstRevenueOptimizerConfiguration = {
  enabled: boolean;
  revenueAnalysisRulesEnabled: boolean;
  productEvaluationRulesEnabled: boolean;
  optimizationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverModifyProductionPricingWithoutValidation: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxOptimizationsPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_FIRST_REVENUE_OPTIMIZER_CONFIGURATION: FirstRevenueOptimizerConfiguration =
  {
    enabled: true,
    revenueAnalysisRulesEnabled: true,
    productEvaluationRulesEnabled: true,
    optimizationRulesEnabled: true,
    validationRulesEnabled: true,
    recommendationRulesEnabled: true,
    neverExposeCredentials: true,
    neverModifyProductionPricingWithoutValidation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    maxOptimizationsPerCycle: 12,
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

export function loadFirstRevenueOptimizerConfigFile(
  repositoryRoot: string,
): Partial<FirstRevenueOptimizerConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "first-revenue-optimizer.config.json"),
    join(repositoryRoot, "config", "first-revenue-optimizer.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<FirstRevenueOptimizerConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildFirstRevenueOptimizerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FirstRevenueOptimizerConfiguration> = {},
): FirstRevenueOptimizerConfiguration {
  const fileConfig = repositoryRoot
    ? loadFirstRevenueOptimizerConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<FirstRevenueOptimizerConfiguration> = {
    enabled: envBool(
      "FIRST_REVENUE_OPTIMIZER_ENABLED",
      DEFAULT_FIRST_REVENUE_OPTIMIZER_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "FIRST_REVENUE_OPTIMIZER_TIMEOUT_MS",
      DEFAULT_FIRST_REVENUE_OPTIMIZER_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "FIRST_REVENUE_OPTIMIZER_MAX_RETRIES",
      DEFAULT_FIRST_REVENUE_OPTIMIZER_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "FIRST_REVENUE_OPTIMIZER_LOG_LEVEL",
      DEFAULT_FIRST_REVENUE_OPTIMIZER_CONFIGURATION.loggingLevel,
    ) as FirstRevenueOptimizerConfiguration["loggingLevel"],
    autoRecover: envBool(
      "FIRST_REVENUE_OPTIMIZER_AUTO_RECOVER",
      DEFAULT_FIRST_REVENUE_OPTIMIZER_CONFIGURATION.autoRecover,
    ),
    maxOptimizationsPerCycle: envInt(
      "FIRST_REVENUE_OPTIMIZER_MAX_OPTIMIZATIONS",
      DEFAULT_FIRST_REVENUE_OPTIMIZER_CONFIGURATION.maxOptimizationsPerCycle,
    ),
  };

  return {
    ...DEFAULT_FIRST_REVENUE_OPTIMIZER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverModifyProductionPricingWithoutValidation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
