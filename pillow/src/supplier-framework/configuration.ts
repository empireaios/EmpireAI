/** R2-01 — Externalized Supplier Framework configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SupplierFrameworkConfiguration = {
  enabled: boolean;
  supplierRegistrationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  eventRoutingRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  apiTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  rateLimitEnabled: boolean;
  defaultEventsPerMinute: number;
  defaultBurstLimit: number;
  rateLimitWindowMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  maxRegisteredSuppliers: number;
  isolateSuppliers: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_SUPPLIER_FRAMEWORK_CONFIGURATION: SupplierFrameworkConfiguration = {
  enabled: true,
  supplierRegistrationRulesEnabled: true,
  validationRulesEnabled: true,
  eventRoutingRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  apiTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  retryBackoffMultiplier: 2,
  rateLimitEnabled: true,
  defaultEventsPerMinute: 60,
  defaultBurstLimit: 10,
  rateLimitWindowMs: 60000,
  loggingLevel: "info",
  autoRecover: true,
  maxRegisteredSuppliers: 50,
  isolateSuppliers: true,
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

export function loadSupplierFrameworkConfigFile(
  repositoryRoot: string,
): Partial<SupplierFrameworkConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "supplier-framework.config.json"),
    join(repositoryRoot, "config", "supplier-framework.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<SupplierFrameworkConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSupplierFrameworkConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SupplierFrameworkConfiguration> = {},
): SupplierFrameworkConfiguration {
  const fileConfig = repositoryRoot ? loadSupplierFrameworkConfigFile(repositoryRoot) : null;
  const envConfig: Partial<SupplierFrameworkConfiguration> = {
    enabled: envBool(
      "SUPPLIER_FRAMEWORK_ENABLED",
      DEFAULT_SUPPLIER_FRAMEWORK_CONFIGURATION.enabled,
    ),
    apiTimeoutMs: envInt(
      "SUPPLIER_FRAMEWORK_TIMEOUT_MS",
      DEFAULT_SUPPLIER_FRAMEWORK_CONFIGURATION.apiTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SUPPLIER_FRAMEWORK_MAX_RETRIES",
      DEFAULT_SUPPLIER_FRAMEWORK_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "SUPPLIER_FRAMEWORK_LOG_LEVEL",
      DEFAULT_SUPPLIER_FRAMEWORK_CONFIGURATION.loggingLevel,
    ) as SupplierFrameworkConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SUPPLIER_FRAMEWORK_AUTO_RECOVER",
      DEFAULT_SUPPLIER_FRAMEWORK_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SUPPLIER_FRAMEWORK_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
