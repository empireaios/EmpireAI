/** R2-17 — Externalized Logistics Optimization configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type LogisticsOptimizationConfiguration = {
  enabled: boolean;
  routeOptimizationRulesEnabled: boolean;
  carrierSelectionRulesEnabled: boolean;
  warehouseSelectionRulesEnabled: boolean;
  costOptimizationThreshold: number;
  deliveryOptimizationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_LOGISTICS_OPTIMIZATION_CONFIGURATION: LogisticsOptimizationConfiguration = {
  enabled: true,
  routeOptimizationRulesEnabled: true,
  carrierSelectionRulesEnabled: true,
  warehouseSelectionRulesEnabled: true,
  costOptimizationThreshold: 15,
  deliveryOptimizationRulesEnabled: true,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  requestTimeoutMs: 30000,
  healthMonitoringRulesEnabled: true,
  loggingLevel: "info",
  autoRecover: true,
  preserveExistingOnValidationFailure: true,
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

export function loadLogisticsOptimizationConfigFile(
  repositoryRoot: string,
): Partial<LogisticsOptimizationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "logistics-optimization.config.json"),
    join(repositoryRoot, "config", "logistics-optimization.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<LogisticsOptimizationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildLogisticsOptimizationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LogisticsOptimizationConfiguration> = {},
): LogisticsOptimizationConfiguration {
  const fileConfig = repositoryRoot ? loadLogisticsOptimizationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<LogisticsOptimizationConfiguration> = {
    enabled: envBool(
      "LOGISTICS_OPTIMIZATION_ENABLED",
      DEFAULT_LOGISTICS_OPTIMIZATION_CONFIGURATION.enabled,
    ),
    costOptimizationThreshold: envInt(
      "LOGISTICS_OPTIMIZATION_COST_THRESHOLD",
      DEFAULT_LOGISTICS_OPTIMIZATION_CONFIGURATION.costOptimizationThreshold,
    ),
    loggingLevel: envString(
      "LOGISTICS_OPTIMIZATION_LOG_LEVEL",
      DEFAULT_LOGISTICS_OPTIMIZATION_CONFIGURATION.loggingLevel,
    ) as LogisticsOptimizationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "LOGISTICS_OPTIMIZATION_AUTO_RECOVER",
      DEFAULT_LOGISTICS_OPTIMIZATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_LOGISTICS_OPTIMIZATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
