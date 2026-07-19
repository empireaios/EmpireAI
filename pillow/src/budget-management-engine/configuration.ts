/** R3-14 — Externalized Budget Management Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { BUDGET_CATEGORIES, BUDGET_PERIODS } from "./paths.js";

export type BudgetPeriodRule = {
  period: (typeof BUDGET_PERIODS)[number];
  label: string;
};

export type BudgetCategoryRule = {
  category: (typeof BUDGET_CATEGORIES)[number];
  label: string;
};

export type BudgetManagementEngineConfiguration = {
  enabled: boolean;
  budgetPeriodRulesEnabled: boolean;
  budgetAllocationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  varianceThresholdPercent: number;
  overrunThresholdPercent: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultBudgetPeriod: (typeof BUDGET_PERIODS)[number];
  defaultBudgetCategory: (typeof BUDGET_CATEGORIES)[number];
  periodRules: BudgetPeriodRule[];
  categoryRules: BudgetCategoryRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_BUDGET_MANAGEMENT_ENGINE_CONFIGURATION: BudgetManagementEngineConfiguration =
  {
    enabled: true,
    budgetPeriodRulesEnabled: true,
    budgetAllocationRulesEnabled: true,
    validationRulesEnabled: true,
    varianceThresholdPercent: 10,
    overrunThresholdPercent: 100,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    defaultBudgetPeriod: "monthly",
    defaultBudgetCategory: "operations",
    periodRules: [
      { period: "monthly", label: "Monthly budget" },
      { period: "quarterly", label: "Quarterly budget" },
      { period: "annual", label: "Annual budget" },
    ],
    categoryRules: [
      { category: "operations", label: "Operations" },
      { category: "marketing", label: "Marketing" },
      { category: "payroll", label: "Payroll" },
      { category: "supplies", label: "Supplies" },
      { category: "overhead", label: "Overhead" },
      { category: "other", label: "Other" },
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

export function loadBudgetManagementEngineConfigFile(
  repositoryRoot: string,
): Partial<BudgetManagementEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "budget-management-engine.config.json"),
    join(repositoryRoot, "config", "budget-management-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<BudgetManagementEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildBudgetManagementEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BudgetManagementEngineConfiguration> = {},
): BudgetManagementEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadBudgetManagementEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<BudgetManagementEngineConfiguration> = {
    enabled: envBool(
      "BUDGET_MANAGEMENT_ENGINE_ENABLED",
      DEFAULT_BUDGET_MANAGEMENT_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "BUDGET_MANAGEMENT_ENGINE_TIMEOUT_MS",
      DEFAULT_BUDGET_MANAGEMENT_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "BUDGET_MANAGEMENT_ENGINE_MAX_RETRIES",
      DEFAULT_BUDGET_MANAGEMENT_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    varianceThresholdPercent: envFloat(
      "BUDGET_MANAGEMENT_ENGINE_VARIANCE_THRESHOLD",
      DEFAULT_BUDGET_MANAGEMENT_ENGINE_CONFIGURATION.varianceThresholdPercent,
    ),
    overrunThresholdPercent: envFloat(
      "BUDGET_MANAGEMENT_ENGINE_OVERRUN_THRESHOLD",
      DEFAULT_BUDGET_MANAGEMENT_ENGINE_CONFIGURATION.overrunThresholdPercent,
    ),
    loggingLevel: envString(
      "BUDGET_MANAGEMENT_ENGINE_LOG_LEVEL",
      DEFAULT_BUDGET_MANAGEMENT_ENGINE_CONFIGURATION.loggingLevel,
    ) as BudgetManagementEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "BUDGET_MANAGEMENT_ENGINE_AUTO_RECOVER",
      DEFAULT_BUDGET_MANAGEMENT_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_BUDGET_MANAGEMENT_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
