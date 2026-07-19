/** R5-13 — Externalized Budget Optimization Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type BudgetOptimizationEngineConfiguration = {
  enabled: boolean;
  allocationRulesEnabled: boolean;
  reallocationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverModifyActiveBudgetsWithoutValidation: true;
  maskSensitiveValues: true;
  overspendThresholdPercent: number;
  inefficiencyThresholdPercent: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_BUDGET_OPTIMIZATION_ENGINE_CONFIGURATION: BudgetOptimizationEngineConfiguration =
  {
    enabled: true,
    allocationRulesEnabled: true,
    reallocationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverModifyActiveBudgetsWithoutValidation: true,
    maskSensitiveValues: true,
    overspendThresholdPercent: 100,
    inefficiencyThresholdPercent: 40,
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

export function loadBudgetOptimizationEngineConfigFile(
  repositoryRoot: string,
): Partial<BudgetOptimizationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "budget-optimization-engine.config.json"),
    join(repositoryRoot, "config", "budget-optimization-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<BudgetOptimizationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildBudgetOptimizationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BudgetOptimizationEngineConfiguration> = {},
): BudgetOptimizationEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadBudgetOptimizationEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<BudgetOptimizationEngineConfiguration> = {
    enabled: envBool(
      "BUDGET_OPTIMIZATION_ENGINE_ENABLED",
      DEFAULT_BUDGET_OPTIMIZATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "BUDGET_OPTIMIZATION_ENGINE_TIMEOUT_MS",
      DEFAULT_BUDGET_OPTIMIZATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "BUDGET_OPTIMIZATION_ENGINE_MAX_RETRIES",
      DEFAULT_BUDGET_OPTIMIZATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "BUDGET_OPTIMIZATION_ENGINE_LOG_LEVEL",
      DEFAULT_BUDGET_OPTIMIZATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as BudgetOptimizationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "BUDGET_OPTIMIZATION_ENGINE_AUTO_RECOVER",
      DEFAULT_BUDGET_OPTIMIZATION_ENGINE_CONFIGURATION.autoRecover,
    ),
    overspendThresholdPercent: envInt(
      "BUDGET_OPTIMIZATION_ENGINE_OVERSPEND_THRESHOLD",
      DEFAULT_BUDGET_OPTIMIZATION_ENGINE_CONFIGURATION.overspendThresholdPercent,
    ),
    inefficiencyThresholdPercent: envInt(
      "BUDGET_OPTIMIZATION_ENGINE_INEFFICIENCY_THRESHOLD",
      DEFAULT_BUDGET_OPTIMIZATION_ENGINE_CONFIGURATION.inefficiencyThresholdPercent,
    ),
  };

  return {
    ...DEFAULT_BUDGET_OPTIMIZATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverModifyActiveBudgetsWithoutValidation: true,
    maskSensitiveValues: true,
  };
}
