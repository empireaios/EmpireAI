/** R3-04 — Externalized Revenue Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type RevenueEngineConfiguration = {
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
  refundDeductionEnabled: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_REVENUE_ENGINE_CONFIGURATION: RevenueEngineConfiguration = {
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
  refundDeductionEnabled: true,
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

export function loadRevenueEngineConfigFile(
  repositoryRoot: string,
): Partial<RevenueEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "revenue-engine.config.json"),
    join(repositoryRoot, "config", "revenue-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<RevenueEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildRevenueEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RevenueEngineConfiguration> = {},
): RevenueEngineConfiguration {
  const fileConfig = repositoryRoot ? loadRevenueEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<RevenueEngineConfiguration> = {
    enabled: envBool("REVENUE_ENGINE_ENABLED", DEFAULT_REVENUE_ENGINE_CONFIGURATION.enabled),
    connectionTimeoutMs: envInt(
      "REVENUE_ENGINE_TIMEOUT_MS",
      DEFAULT_REVENUE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "REVENUE_ENGINE_MAX_RETRIES",
      DEFAULT_REVENUE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "REVENUE_ENGINE_LOG_LEVEL",
      DEFAULT_REVENUE_ENGINE_CONFIGURATION.loggingLevel,
    ) as RevenueEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "REVENUE_ENGINE_AUTO_RECOVER",
      DEFAULT_REVENUE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_REVENUE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
