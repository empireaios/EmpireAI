/** R2-05 — Externalized Supplier Product Sync configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SupplierProductSyncConfiguration = {
  enabled: boolean;
  synchronizationFrequencyMs: number;
  productMappingRulesEnabled: boolean;
  changeDetectionRulesEnabled: boolean;
  duplicateDetectionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveSupplierProductIdentifiers: boolean;
  preserveExistingOnValidationFailure: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_SUPPLIER_PRODUCT_SYNC_CONFIGURATION: SupplierProductSyncConfiguration = {
  enabled: true,
  synchronizationFrequencyMs: 300000,
  productMappingRulesEnabled: true,
  changeDetectionRulesEnabled: true,
  duplicateDetectionRulesEnabled: true,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  requestTimeoutMs: 30000,
  healthMonitoringRulesEnabled: true,
  loggingLevel: "info",
  autoRecover: true,
  preserveSupplierProductIdentifiers: true,
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

export function loadSupplierProductSyncConfigFile(
  repositoryRoot: string,
): Partial<SupplierProductSyncConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "supplier-product-sync.config.json"),
    join(repositoryRoot, "config", "supplier-product-sync.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<SupplierProductSyncConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSupplierProductSyncConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SupplierProductSyncConfiguration> = {},
): SupplierProductSyncConfiguration {
  const fileConfig = repositoryRoot ? loadSupplierProductSyncConfigFile(repositoryRoot) : null;
  const envConfig: Partial<SupplierProductSyncConfiguration> = {
    enabled: envBool(
      "SUPPLIER_PRODUCT_SYNC_ENABLED",
      DEFAULT_SUPPLIER_PRODUCT_SYNC_CONFIGURATION.enabled,
    ),
    synchronizationFrequencyMs: envInt(
      "SUPPLIER_PRODUCT_SYNC_FREQUENCY_MS",
      DEFAULT_SUPPLIER_PRODUCT_SYNC_CONFIGURATION.synchronizationFrequencyMs,
    ),
    requestTimeoutMs: envInt(
      "SUPPLIER_PRODUCT_SYNC_TIMEOUT_MS",
      DEFAULT_SUPPLIER_PRODUCT_SYNC_CONFIGURATION.requestTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SUPPLIER_PRODUCT_SYNC_MAX_RETRIES",
      DEFAULT_SUPPLIER_PRODUCT_SYNC_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "SUPPLIER_PRODUCT_SYNC_LOG_LEVEL",
      DEFAULT_SUPPLIER_PRODUCT_SYNC_CONFIGURATION.loggingLevel,
    ) as SupplierProductSyncConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SUPPLIER_PRODUCT_SYNC_AUTO_RECOVER",
      DEFAULT_SUPPLIER_PRODUCT_SYNC_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SUPPLIER_PRODUCT_SYNC_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
