/** R2-20 — Externalized Supplier Operations Certification configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SupplierOperationsCertificationConfiguration = {
  enabled: boolean;
  certificationScope:
    | "full"
    | "framework"
    | "connectors"
    | "sync"
    | "procurement"
    | "fulfilment"
    | "warehouse"
    | "logistics"
    | "risk";
  requiredValidationRulesEnabled: boolean;
  passThresholdPercent: number;
  failureDetectionRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  includeSmokeTests: boolean;
  safeTestMode: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_SUPPLIER_OPERATIONS_CERTIFICATION_CONFIGURATION: SupplierOperationsCertificationConfiguration =
  {
    enabled: true,
    certificationScope: "full",
    requiredValidationRulesEnabled: true,
    passThresholdPercent: 85,
    failureDetectionRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 120000,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    includeSmokeTests: true,
    safeTestMode: true,
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

export function loadSupplierOperationsCertificationConfigFile(
  repositoryRoot: string,
): Partial<SupplierOperationsCertificationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "supplier-operations-certification.config.json"),
    join(repositoryRoot, "config", "supplier-operations-certification.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<SupplierOperationsCertificationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSupplierOperationsCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SupplierOperationsCertificationConfiguration> = {},
): SupplierOperationsCertificationConfiguration {
  const fileConfig = repositoryRoot
    ? loadSupplierOperationsCertificationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<SupplierOperationsCertificationConfiguration> = {
    enabled: envBool(
      "SUPPLIER_OPERATIONS_CERTIFICATION_ENABLED",
      DEFAULT_SUPPLIER_OPERATIONS_CERTIFICATION_CONFIGURATION.enabled,
    ),
    passThresholdPercent: envInt(
      "SUPPLIER_OPERATIONS_CERTIFICATION_PASS_THRESHOLD",
      DEFAULT_SUPPLIER_OPERATIONS_CERTIFICATION_CONFIGURATION.passThresholdPercent,
    ),
    loggingLevel: envString(
      "SUPPLIER_OPERATIONS_CERTIFICATION_LOG_LEVEL",
      DEFAULT_SUPPLIER_OPERATIONS_CERTIFICATION_CONFIGURATION.loggingLevel,
    ) as SupplierOperationsCertificationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SUPPLIER_OPERATIONS_CERTIFICATION_AUTO_RECOVER",
      DEFAULT_SUPPLIER_OPERATIONS_CERTIFICATION_CONFIGURATION.autoRecover,
    ),
    includeSmokeTests: envBool(
      "SUPPLIER_OPERATIONS_CERTIFICATION_INCLUDE_SMOKE_TESTS",
      DEFAULT_SUPPLIER_OPERATIONS_CERTIFICATION_CONFIGURATION.includeSmokeTests,
    ),
  };

  return {
    ...DEFAULT_SUPPLIER_OPERATIONS_CERTIFICATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
    safeTestMode: true,
  };
}
