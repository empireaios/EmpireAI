/** R3-18 — Externalized Financial Operations Certification configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type FinancialOperationsCertificationConfiguration = {
  enabled: boolean;
  certificationScope:
    | "full"
    | "framework"
    | "payments"
    | "core"
    | "reconciliation"
    | "invoicing"
    | "tax"
    | "reporting";
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

export const DEFAULT_FINANCIAL_OPERATIONS_CERTIFICATION_CONFIGURATION: FinancialOperationsCertificationConfiguration =
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

export function loadFinancialOperationsCertificationConfigFile(
  repositoryRoot: string,
): Partial<FinancialOperationsCertificationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "financial-operations-certification.config.json"),
    join(repositoryRoot, "config", "financial-operations-certification.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<FinancialOperationsCertificationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildFinancialOperationsCertificationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FinancialOperationsCertificationConfiguration> = {},
): FinancialOperationsCertificationConfiguration {
  const fileConfig = repositoryRoot
    ? loadFinancialOperationsCertificationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<FinancialOperationsCertificationConfiguration> = {
    enabled: envBool(
      "FINANCIAL_OPERATIONS_CERTIFICATION_ENABLED",
      DEFAULT_FINANCIAL_OPERATIONS_CERTIFICATION_CONFIGURATION.enabled,
    ),
    passThresholdPercent: envInt(
      "FINANCIAL_OPERATIONS_CERTIFICATION_PASS_THRESHOLD",
      DEFAULT_FINANCIAL_OPERATIONS_CERTIFICATION_CONFIGURATION.passThresholdPercent,
    ),
    loggingLevel: envString(
      "FINANCIAL_OPERATIONS_CERTIFICATION_LOG_LEVEL",
      DEFAULT_FINANCIAL_OPERATIONS_CERTIFICATION_CONFIGURATION.loggingLevel,
    ) as FinancialOperationsCertificationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "FINANCIAL_OPERATIONS_CERTIFICATION_AUTO_RECOVER",
      DEFAULT_FINANCIAL_OPERATIONS_CERTIFICATION_CONFIGURATION.autoRecover,
    ),
    includeSmokeTests: envBool(
      "FINANCIAL_OPERATIONS_CERTIFICATION_INCLUDE_SMOKE_TESTS",
      DEFAULT_FINANCIAL_OPERATIONS_CERTIFICATION_CONFIGURATION.includeSmokeTests,
    ),
  };

  return {
    ...DEFAULT_FINANCIAL_OPERATIONS_CERTIFICATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
    safeTestMode: overrides.safeTestMode ?? fileConfig?.safeTestMode ?? true,
  };
}
