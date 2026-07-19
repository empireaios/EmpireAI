/** R2-06 — Externalized Supplier Inventory Sync configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SupplierInventorySyncConfiguration = {
  enabled: boolean;
  synchronizationFrequencyMs: number;
  stockValidationRulesEnabled: boolean;
  inventoryMappingRulesEnabled: boolean;
  changeDetectionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  lowStockThreshold: number;
  maskSensitiveValues: true;
};

export const DEFAULT_SUPPLIER_INVENTORY_SYNC_CONFIGURATION: SupplierInventorySyncConfiguration =
  {
    enabled: true,
    synchronizationFrequencyMs: 300000,
    stockValidationRulesEnabled: true,
    inventoryMappingRulesEnabled: true,
    changeDetectionRulesEnabled: true,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 30000,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    preserveExistingOnValidationFailure: true,
    lowStockThreshold: 10,
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

export function loadSupplierInventorySyncConfigFile(
  repositoryRoot: string,
): Partial<SupplierInventorySyncConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "supplier-inventory-sync.config.json"),
    join(repositoryRoot, "config", "supplier-inventory-sync.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<SupplierInventorySyncConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSupplierInventorySyncConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SupplierInventorySyncConfiguration> = {},
): SupplierInventorySyncConfiguration {
  const fileConfig = repositoryRoot ? loadSupplierInventorySyncConfigFile(repositoryRoot) : null;
  const envConfig: Partial<SupplierInventorySyncConfiguration> = {
    enabled: envBool(
      "SUPPLIER_INVENTORY_SYNC_ENABLED",
      DEFAULT_SUPPLIER_INVENTORY_SYNC_CONFIGURATION.enabled,
    ),
    synchronizationFrequencyMs: envInt(
      "SUPPLIER_INVENTORY_SYNC_FREQUENCY_MS",
      DEFAULT_SUPPLIER_INVENTORY_SYNC_CONFIGURATION.synchronizationFrequencyMs,
    ),
    requestTimeoutMs: envInt(
      "SUPPLIER_INVENTORY_SYNC_TIMEOUT_MS",
      DEFAULT_SUPPLIER_INVENTORY_SYNC_CONFIGURATION.requestTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SUPPLIER_INVENTORY_SYNC_MAX_RETRIES",
      DEFAULT_SUPPLIER_INVENTORY_SYNC_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "SUPPLIER_INVENTORY_SYNC_LOG_LEVEL",
      DEFAULT_SUPPLIER_INVENTORY_SYNC_CONFIGURATION.loggingLevel,
    ) as SupplierInventorySyncConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SUPPLIER_INVENTORY_SYNC_AUTO_RECOVER",
      DEFAULT_SUPPLIER_INVENTORY_SYNC_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SUPPLIER_INVENTORY_SYNC_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
