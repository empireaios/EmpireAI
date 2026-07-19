/** R3-06 — Externalized Profit Calculation Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ProfitCalculationEngineConfiguration = {
  enabled: boolean;
  calculationRulesEnabled: boolean;
  marginCalculationRulesEnabled: boolean;
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
  operatingExpenseCategories: string[];
  maskSensitiveValues: true;
};

export const DEFAULT_PROFIT_CALCULATION_ENGINE_CONFIGURATION: ProfitCalculationEngineConfiguration =
  {
    enabled: true,
    calculationRulesEnabled: true,
    marginCalculationRulesEnabled: true,
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
    operatingExpenseCategories: [
      "shipping",
      "advertising",
      "platform_fee",
      "operational",
      "recurring",
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

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadProfitCalculationEngineConfigFile(
  repositoryRoot: string,
): Partial<ProfitCalculationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "profit-calculation-engine.config.json"),
    join(repositoryRoot, "config", "profit-calculation-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ProfitCalculationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildProfitCalculationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ProfitCalculationEngineConfiguration> = {},
): ProfitCalculationEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadProfitCalculationEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ProfitCalculationEngineConfiguration> = {
    enabled: envBool(
      "PROFIT_CALCULATION_ENGINE_ENABLED",
      DEFAULT_PROFIT_CALCULATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "PROFIT_CALCULATION_ENGINE_TIMEOUT_MS",
      DEFAULT_PROFIT_CALCULATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PROFIT_CALCULATION_ENGINE_MAX_RETRIES",
      DEFAULT_PROFIT_CALCULATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "PROFIT_CALCULATION_ENGINE_LOG_LEVEL",
      DEFAULT_PROFIT_CALCULATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as ProfitCalculationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PROFIT_CALCULATION_ENGINE_AUTO_RECOVER",
      DEFAULT_PROFIT_CALCULATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PROFIT_CALCULATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
