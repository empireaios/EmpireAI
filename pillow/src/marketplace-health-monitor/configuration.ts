/** R1-14 — Externalized Marketplace Health Monitor configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type MarketplaceHealthMonitorConfiguration = {
  enabled: boolean;
  healthCheckFrequencyMinutes: number;
  performanceThresholdsEnabled: boolean;
  alertThresholdsEnabled: boolean;
  failureDetectionRulesEnabled: boolean;
  apiLatencyThresholdMs: number;
  apiErrorRateThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveHealthHistory: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_MARKETPLACE_HEALTH_MONITOR_CONFIGURATION: MarketplaceHealthMonitorConfiguration =
  {
    enabled: true,
    healthCheckFrequencyMinutes: 5,
    performanceThresholdsEnabled: true,
    alertThresholdsEnabled: true,
    failureDetectionRulesEnabled: true,
    apiLatencyThresholdMs: 2000,
    apiErrorRateThreshold: 0.1,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 30000,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    preserveHealthHistory: true,
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

export function loadMarketplaceHealthMonitorConfigFile(
  repositoryRoot: string,
): Partial<MarketplaceHealthMonitorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "marketplace-health-monitor.config.json"),
    join(repositoryRoot, "config", "marketplace-health-monitor.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<MarketplaceHealthMonitorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMarketplaceHealthMonitorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MarketplaceHealthMonitorConfiguration> = {},
): MarketplaceHealthMonitorConfiguration {
  const fileConfig = repositoryRoot
    ? loadMarketplaceHealthMonitorConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<MarketplaceHealthMonitorConfiguration> = {
    enabled: envBool(
      "MARKETPLACE_HEALTH_MONITOR_ENABLED",
      DEFAULT_MARKETPLACE_HEALTH_MONITOR_CONFIGURATION.enabled,
    ),
    healthCheckFrequencyMinutes: envInt(
      "MARKETPLACE_HEALTH_MONITOR_CHECK_FREQUENCY_MINUTES",
      DEFAULT_MARKETPLACE_HEALTH_MONITOR_CONFIGURATION.healthCheckFrequencyMinutes,
    ),
    apiLatencyThresholdMs: envInt(
      "MARKETPLACE_HEALTH_MONITOR_LATENCY_THRESHOLD_MS",
      DEFAULT_MARKETPLACE_HEALTH_MONITOR_CONFIGURATION.apiLatencyThresholdMs,
    ),
    requestTimeoutMs: envInt(
      "MARKETPLACE_HEALTH_MONITOR_TIMEOUT_MS",
      DEFAULT_MARKETPLACE_HEALTH_MONITOR_CONFIGURATION.requestTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "MARKETPLACE_HEALTH_MONITOR_MAX_RETRIES",
      DEFAULT_MARKETPLACE_HEALTH_MONITOR_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "MARKETPLACE_HEALTH_MONITOR_LOG_LEVEL",
      DEFAULT_MARKETPLACE_HEALTH_MONITOR_CONFIGURATION.loggingLevel,
    ) as MarketplaceHealthMonitorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MARKETPLACE_HEALTH_MONITOR_AUTO_RECOVER",
      DEFAULT_MARKETPLACE_HEALTH_MONITOR_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_MARKETPLACE_HEALTH_MONITOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
