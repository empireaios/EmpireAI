/** R3-01 — Externalized Financial Framework configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type FinancialFrameworkConfiguration = {
  enabled: boolean;
  moduleRegistrationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  eventRoutingRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  apiTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  rateLimitEnabled: boolean;
  defaultEventsPerMinute: number;
  defaultBurstLimit: number;
  rateLimitWindowMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  maxRegisteredModules: number;
  isolateModules: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_FINANCIAL_FRAMEWORK_CONFIGURATION: FinancialFrameworkConfiguration = {
  enabled: true,
  moduleRegistrationRulesEnabled: true,
  validationRulesEnabled: true,
  eventRoutingRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  apiTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  retryBackoffMultiplier: 2,
  rateLimitEnabled: true,
  defaultEventsPerMinute: 60,
  defaultBurstLimit: 10,
  rateLimitWindowMs: 60000,
  loggingLevel: "info",
  autoRecover: true,
  maxRegisteredModules: 50,
  isolateModules: true,
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

export function loadFinancialFrameworkConfigFile(
  repositoryRoot: string,
): Partial<FinancialFrameworkConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "financial-framework.config.json"),
    join(repositoryRoot, "config", "financial-framework.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<FinancialFrameworkConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildFinancialFrameworkConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FinancialFrameworkConfiguration> = {},
): FinancialFrameworkConfiguration {
  const fileConfig = repositoryRoot ? loadFinancialFrameworkConfigFile(repositoryRoot) : null;
  const envConfig: Partial<FinancialFrameworkConfiguration> = {
    enabled: envBool(
      "FINANCIAL_FRAMEWORK_ENABLED",
      DEFAULT_FINANCIAL_FRAMEWORK_CONFIGURATION.enabled,
    ),
    apiTimeoutMs: envInt(
      "FINANCIAL_FRAMEWORK_TIMEOUT_MS",
      DEFAULT_FINANCIAL_FRAMEWORK_CONFIGURATION.apiTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "FINANCIAL_FRAMEWORK_MAX_RETRIES",
      DEFAULT_FINANCIAL_FRAMEWORK_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "FINANCIAL_FRAMEWORK_LOG_LEVEL",
      DEFAULT_FINANCIAL_FRAMEWORK_CONFIGURATION.loggingLevel,
    ) as FinancialFrameworkConfiguration["loggingLevel"],
    autoRecover: envBool(
      "FINANCIAL_FRAMEWORK_AUTO_RECOVER",
      DEFAULT_FINANCIAL_FRAMEWORK_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_FINANCIAL_FRAMEWORK_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
