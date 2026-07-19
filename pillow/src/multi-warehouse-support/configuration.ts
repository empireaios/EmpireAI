/** R2-15 — Externalized Multi-Warehouse Support configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type MultiWarehouseSupportConfiguration = {
  enabled: boolean;
  warehouseRegistrationRulesEnabled: boolean;
  warehouseSelectionRulesEnabled: boolean;
  inventoryTransferRulesEnabled: boolean;
  capacityThresholdPercent: number;
  imbalanceThresholdPercent: number;
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

export const DEFAULT_MULTI_WAREHOUSE_SUPPORT_CONFIGURATION: MultiWarehouseSupportConfiguration = {
  enabled: true,
  warehouseRegistrationRulesEnabled: true,
  warehouseSelectionRulesEnabled: true,
  inventoryTransferRulesEnabled: true,
  capacityThresholdPercent: 85,
  imbalanceThresholdPercent: 30,
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

export function loadMultiWarehouseSupportConfigFile(
  repositoryRoot: string,
): Partial<MultiWarehouseSupportConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "multi-warehouse-support.config.json"),
    join(repositoryRoot, "config", "multi-warehouse-support.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<MultiWarehouseSupportConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMultiWarehouseSupportConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MultiWarehouseSupportConfiguration> = {},
): MultiWarehouseSupportConfiguration {
  const fileConfig = repositoryRoot ? loadMultiWarehouseSupportConfigFile(repositoryRoot) : null;
  const envConfig: Partial<MultiWarehouseSupportConfiguration> = {
    enabled: envBool(
      "MULTI_WAREHOUSE_SUPPORT_ENABLED",
      DEFAULT_MULTI_WAREHOUSE_SUPPORT_CONFIGURATION.enabled,
    ),
    capacityThresholdPercent: envInt(
      "MULTI_WAREHOUSE_SUPPORT_CAPACITY_THRESHOLD",
      DEFAULT_MULTI_WAREHOUSE_SUPPORT_CONFIGURATION.capacityThresholdPercent,
    ),
    loggingLevel: envString(
      "MULTI_WAREHOUSE_SUPPORT_LOG_LEVEL",
      DEFAULT_MULTI_WAREHOUSE_SUPPORT_CONFIGURATION.loggingLevel,
    ) as MultiWarehouseSupportConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MULTI_WAREHOUSE_SUPPORT_AUTO_RECOVER",
      DEFAULT_MULTI_WAREHOUSE_SUPPORT_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_MULTI_WAREHOUSE_SUPPORT_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
