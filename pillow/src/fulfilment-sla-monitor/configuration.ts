/** R2-18 — Externalized Fulfilment SLA Monitor configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type FulfilmentSlaMonitorConfiguration = {
  enabled: boolean;
  slaThresholdHours: number;
  breachThresholdScore: number;
  riskThresholdScore: number;
  complianceRulesEnabled: boolean;
  alertRulesEnabled: boolean;
  monitoringFrequencyMs: number;
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

export const DEFAULT_FULFILMENT_SLA_MONITOR_CONFIGURATION: FulfilmentSlaMonitorConfiguration = {
  enabled: true,
  slaThresholdHours: 72,
  breachThresholdScore: 40,
  riskThresholdScore: 70,
  complianceRulesEnabled: true,
  alertRulesEnabled: true,
  monitoringFrequencyMs: 300000,
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

export function loadFulfilmentSlaMonitorConfigFile(
  repositoryRoot: string,
): Partial<FulfilmentSlaMonitorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "fulfilment-sla-monitor.config.json"),
    join(repositoryRoot, "config", "fulfilment-sla-monitor.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<FulfilmentSlaMonitorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildFulfilmentSlaMonitorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FulfilmentSlaMonitorConfiguration> = {},
): FulfilmentSlaMonitorConfiguration {
  const fileConfig = repositoryRoot ? loadFulfilmentSlaMonitorConfigFile(repositoryRoot) : null;
  const envConfig: Partial<FulfilmentSlaMonitorConfiguration> = {
    enabled: envBool(
      "FULFILMENT_SLA_MONITOR_ENABLED",
      DEFAULT_FULFILMENT_SLA_MONITOR_CONFIGURATION.enabled,
    ),
    slaThresholdHours: envInt(
      "FULFILMENT_SLA_MONITOR_THRESHOLD_HOURS",
      DEFAULT_FULFILMENT_SLA_MONITOR_CONFIGURATION.slaThresholdHours,
    ),
    loggingLevel: envString(
      "FULFILMENT_SLA_MONITOR_LOG_LEVEL",
      DEFAULT_FULFILMENT_SLA_MONITOR_CONFIGURATION.loggingLevel,
    ) as FulfilmentSlaMonitorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "FULFILMENT_SLA_MONITOR_AUTO_RECOVER",
      DEFAULT_FULFILMENT_SLA_MONITOR_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_FULFILMENT_SLA_MONITOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
