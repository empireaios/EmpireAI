/** R3-07 — Externalized Cash Flow Monitor configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CashFlowMonitorConfiguration = {
  enabled: boolean;
  monitoringFrequencyMinutes: number;
  liquidityThresholdHealthy: number;
  liquidityThresholdAdequate: number;
  liquidityThresholdLow: number;
  forecastRulesEnabled: boolean;
  forecastHorizonDays: number;
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

export const DEFAULT_CASH_FLOW_MONITOR_CONFIGURATION: CashFlowMonitorConfiguration = {
  enabled: true,
  monitoringFrequencyMinutes: 15,
  liquidityThresholdHealthy: 10000,
  liquidityThresholdAdequate: 5000,
  liquidityThresholdLow: 1000,
  forecastRulesEnabled: true,
  forecastHorizonDays: 7,
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

export function loadCashFlowMonitorConfigFile(
  repositoryRoot: string,
): Partial<CashFlowMonitorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "cash-flow-monitor.config.json"),
    join(repositoryRoot, "config", "cash-flow-monitor.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<CashFlowMonitorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCashFlowMonitorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CashFlowMonitorConfiguration> = {},
): CashFlowMonitorConfiguration {
  const fileConfig = repositoryRoot ? loadCashFlowMonitorConfigFile(repositoryRoot) : null;
  const envConfig: Partial<CashFlowMonitorConfiguration> = {
    enabled: envBool(
      "CASH_FLOW_MONITOR_ENABLED",
      DEFAULT_CASH_FLOW_MONITOR_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CASH_FLOW_MONITOR_TIMEOUT_MS",
      DEFAULT_CASH_FLOW_MONITOR_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CASH_FLOW_MONITOR_MAX_RETRIES",
      DEFAULT_CASH_FLOW_MONITOR_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "CASH_FLOW_MONITOR_LOG_LEVEL",
      DEFAULT_CASH_FLOW_MONITOR_CONFIGURATION.loggingLevel,
    ) as CashFlowMonitorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CASH_FLOW_MONITOR_AUTO_RECOVER",
      DEFAULT_CASH_FLOW_MONITOR_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CASH_FLOW_MONITOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
