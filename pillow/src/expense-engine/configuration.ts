/** R3-05 — Externalized Expense Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ExpenseEngineConfiguration = {
  enabled: boolean;
  classificationRulesEnabled: boolean;
  aggregationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultCurrency: string;
  maskSensitiveValues: true;
};

export const DEFAULT_EXPENSE_ENGINE_CONFIGURATION: ExpenseEngineConfiguration = {
  enabled: true,
  classificationRulesEnabled: true,
  aggregationRulesEnabled: true,
  validationRulesEnabled: true,
  anomalyDetectionEnabled: true,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  defaultCurrency: "USD",
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

export function loadExpenseEngineConfigFile(
  repositoryRoot: string,
): Partial<ExpenseEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "expense-engine.config.json"),
    join(repositoryRoot, "config", "expense-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ExpenseEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildExpenseEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExpenseEngineConfiguration> = {},
): ExpenseEngineConfiguration {
  const fileConfig = repositoryRoot ? loadExpenseEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ExpenseEngineConfiguration> = {
    enabled: envBool("EXPENSE_ENGINE_ENABLED", DEFAULT_EXPENSE_ENGINE_CONFIGURATION.enabled),
    connectionTimeoutMs: envInt(
      "EXPENSE_ENGINE_TIMEOUT_MS",
      DEFAULT_EXPENSE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "EXPENSE_ENGINE_MAX_RETRIES",
      DEFAULT_EXPENSE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "EXPENSE_ENGINE_LOG_LEVEL",
      DEFAULT_EXPENSE_ENGINE_CONFIGURATION.loggingLevel,
    ) as ExpenseEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EXPENSE_ENGINE_AUTO_RECOVER",
      DEFAULT_EXPENSE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_EXPENSE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
