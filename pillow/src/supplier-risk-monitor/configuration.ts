/** R2-16 — Externalized Supplier Risk Monitor configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SupplierRiskMonitorConfiguration = {
  enabled: boolean;
  riskThresholdScore: number;
  highRiskThresholdScore: number;
  healthMonitoringFrequencyMs: number;
  alertRulesEnabled: boolean;
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

export const DEFAULT_SUPPLIER_RISK_MONITOR_CONFIGURATION: SupplierRiskMonitorConfiguration = {
  enabled: true,
  riskThresholdScore: 50,
  highRiskThresholdScore: 75,
  healthMonitoringFrequencyMs: 300000,
  alertRulesEnabled: true,
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

export function loadSupplierRiskMonitorConfigFile(
  repositoryRoot: string,
): Partial<SupplierRiskMonitorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "supplier-risk-monitor.config.json"),
    join(repositoryRoot, "config", "supplier-risk-monitor.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<SupplierRiskMonitorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSupplierRiskMonitorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SupplierRiskMonitorConfiguration> = {},
): SupplierRiskMonitorConfiguration {
  const fileConfig = repositoryRoot ? loadSupplierRiskMonitorConfigFile(repositoryRoot) : null;
  const envConfig: Partial<SupplierRiskMonitorConfiguration> = {
    enabled: envBool(
      "SUPPLIER_RISK_MONITOR_ENABLED",
      DEFAULT_SUPPLIER_RISK_MONITOR_CONFIGURATION.enabled,
    ),
    riskThresholdScore: envInt(
      "SUPPLIER_RISK_MONITOR_RISK_THRESHOLD",
      DEFAULT_SUPPLIER_RISK_MONITOR_CONFIGURATION.riskThresholdScore,
    ),
    loggingLevel: envString(
      "SUPPLIER_RISK_MONITOR_LOG_LEVEL",
      DEFAULT_SUPPLIER_RISK_MONITOR_CONFIGURATION.loggingLevel,
    ) as SupplierRiskMonitorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SUPPLIER_RISK_MONITOR_AUTO_RECOVER",
      DEFAULT_SUPPLIER_RISK_MONITOR_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SUPPLIER_RISK_MONITOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
