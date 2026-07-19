/** R4-19 — Externalized Customer Operations Certification configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CustomerOperationsCertificationConfiguration = {
  enabled: boolean;
  certificationScope:
    | "full"
    | "identity"
    | "crm"
    | "timeline"
    | "communication"
    | "support"
    | "analytics"
    | "intelligence";
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

export const DEFAULT_CUSTOMER_OPERATIONS_CERTIFICATION_CONFIGURATION: CustomerOperationsCertificationConfiguration =
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

export function loadCustomerOperationsCertificationConfigFile(
  repositoryRoot: string,
): Partial<CustomerOperationsCertificationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "customer-operations-certification.config.json"),
    join(repositoryRoot, "config", "customer-operations-certification.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CustomerOperationsCertificationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCustomerOperationsCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CustomerOperationsCertificationConfiguration> = {},
): CustomerOperationsCertificationConfiguration {
  const fileConfig = repositoryRoot
    ? loadCustomerOperationsCertificationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CustomerOperationsCertificationConfiguration> = {
    enabled: envBool(
      "CUSTOMER_OPERATIONS_CERTIFICATION_ENABLED",
      DEFAULT_CUSTOMER_OPERATIONS_CERTIFICATION_CONFIGURATION.enabled,
    ),
    passThresholdPercent: envInt(
      "CUSTOMER_OPERATIONS_CERTIFICATION_PASS_THRESHOLD",
      DEFAULT_CUSTOMER_OPERATIONS_CERTIFICATION_CONFIGURATION.passThresholdPercent,
    ),
    loggingLevel: envString(
      "CUSTOMER_OPERATIONS_CERTIFICATION_LOG_LEVEL",
      DEFAULT_CUSTOMER_OPERATIONS_CERTIFICATION_CONFIGURATION.loggingLevel,
    ) as CustomerOperationsCertificationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CUSTOMER_OPERATIONS_CERTIFICATION_AUTO_RECOVER",
      DEFAULT_CUSTOMER_OPERATIONS_CERTIFICATION_CONFIGURATION.autoRecover,
    ),
    includeSmokeTests: envBool(
      "CUSTOMER_OPERATIONS_CERTIFICATION_INCLUDE_SMOKE_TESTS",
      DEFAULT_CUSTOMER_OPERATIONS_CERTIFICATION_CONFIGURATION.includeSmokeTests,
    ),
  };

  return {
    ...DEFAULT_CUSTOMER_OPERATIONS_CERTIFICATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
    safeTestMode: overrides.safeTestMode ?? fileConfig?.safeTestMode ?? true,
  };
}
