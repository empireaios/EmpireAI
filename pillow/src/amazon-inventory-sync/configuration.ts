/** R1-05 — Externalized Amazon Inventory Sync configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AmazonInventorySyncConfiguration = {
  enabled: boolean;
  syncFrequencyMinutes: number;
  lowStockThreshold: number;
  discrepancyRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  allowStockPush: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_AMAZON_INVENTORY_SYNC_CONFIGURATION: AmazonInventorySyncConfiguration = {
  enabled: true,
  syncFrequencyMinutes: 30,
  lowStockThreshold: 10,
  discrepancyRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  requestTimeoutMs: 30000,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  loggingLevel: "info",
  autoRecover: true,
  preserveExistingOnValidationFailure: true,
  allowStockPush: false,
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

export function loadAmazonInventorySyncConfigFile(
  repositoryRoot: string,
): Partial<AmazonInventorySyncConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "amazon-inventory-sync.config.json"),
    join(repositoryRoot, "config", "amazon-inventory-sync.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<AmazonInventorySyncConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAmazonInventorySyncConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AmazonInventorySyncConfiguration> = {},
): AmazonInventorySyncConfiguration {
  const fileConfig = repositoryRoot ? loadAmazonInventorySyncConfigFile(repositoryRoot) : null;
  const envConfig: Partial<AmazonInventorySyncConfiguration> = {
    enabled: envBool(
      "AMAZON_INVENTORY_SYNC_ENABLED",
      DEFAULT_AMAZON_INVENTORY_SYNC_CONFIGURATION.enabled,
    ),
    syncFrequencyMinutes: envInt(
      "AMAZON_INVENTORY_SYNC_FREQUENCY_MINUTES",
      DEFAULT_AMAZON_INVENTORY_SYNC_CONFIGURATION.syncFrequencyMinutes,
    ),
    lowStockThreshold: envInt(
      "AMAZON_INVENTORY_SYNC_LOW_STOCK_THRESHOLD",
      DEFAULT_AMAZON_INVENTORY_SYNC_CONFIGURATION.lowStockThreshold,
    ),
    requestTimeoutMs: envInt(
      "AMAZON_INVENTORY_SYNC_TIMEOUT_MS",
      DEFAULT_AMAZON_INVENTORY_SYNC_CONFIGURATION.requestTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "AMAZON_INVENTORY_SYNC_MAX_RETRIES",
      DEFAULT_AMAZON_INVENTORY_SYNC_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "AMAZON_INVENTORY_SYNC_LOG_LEVEL",
      DEFAULT_AMAZON_INVENTORY_SYNC_CONFIGURATION.loggingLevel,
    ) as AmazonInventorySyncConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AMAZON_INVENTORY_SYNC_AUTO_RECOVER",
      DEFAULT_AMAZON_INVENTORY_SYNC_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_AMAZON_INVENTORY_SYNC_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
