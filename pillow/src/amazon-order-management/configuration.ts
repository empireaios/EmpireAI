/** R1-04 — Externalized Amazon Order Management configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AmazonOrderManagementConfiguration = {
  enabled: boolean;
  syncFrequencyMinutes: number;
  orderStatusRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  allowOrderModification: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_AMAZON_ORDER_MANAGEMENT_CONFIGURATION: AmazonOrderManagementConfiguration = {
  enabled: true,
  syncFrequencyMinutes: 15,
  orderStatusRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  requestTimeoutMs: 30000,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  loggingLevel: "info",
  autoRecover: true,
  preserveExistingOnValidationFailure: true,
  allowOrderModification: false,
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

export function loadAmazonOrderManagementConfigFile(
  repositoryRoot: string,
): Partial<AmazonOrderManagementConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "amazon-order-management.config.json"),
    join(repositoryRoot, "config", "amazon-order-management.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AmazonOrderManagementConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAmazonOrderManagementConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AmazonOrderManagementConfiguration> = {},
): AmazonOrderManagementConfiguration {
  const fileConfig = repositoryRoot ? loadAmazonOrderManagementConfigFile(repositoryRoot) : null;
  const envConfig: Partial<AmazonOrderManagementConfiguration> = {
    enabled: envBool(
      "AMAZON_ORDER_MANAGEMENT_ENABLED",
      DEFAULT_AMAZON_ORDER_MANAGEMENT_CONFIGURATION.enabled,
    ),
    syncFrequencyMinutes: envInt(
      "AMAZON_ORDER_MANAGEMENT_SYNC_FREQUENCY_MINUTES",
      DEFAULT_AMAZON_ORDER_MANAGEMENT_CONFIGURATION.syncFrequencyMinutes,
    ),
    requestTimeoutMs: envInt(
      "AMAZON_ORDER_MANAGEMENT_TIMEOUT_MS",
      DEFAULT_AMAZON_ORDER_MANAGEMENT_CONFIGURATION.requestTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "AMAZON_ORDER_MANAGEMENT_MAX_RETRIES",
      DEFAULT_AMAZON_ORDER_MANAGEMENT_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "AMAZON_ORDER_MANAGEMENT_LOG_LEVEL",
      DEFAULT_AMAZON_ORDER_MANAGEMENT_CONFIGURATION.loggingLevel,
    ) as AmazonOrderManagementConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AMAZON_ORDER_MANAGEMENT_AUTO_RECOVER",
      DEFAULT_AMAZON_ORDER_MANAGEMENT_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_AMAZON_ORDER_MANAGEMENT_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
