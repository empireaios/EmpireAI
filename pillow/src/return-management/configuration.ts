/** R2-13 — Externalized Return Management configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ReturnManagementConfiguration = {
  enabled: boolean;
  returnEligibilityRulesEnabled: boolean;
  supplierReturnRulesEnabled: boolean;
  carrierReturnRulesEnabled: boolean;
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

export const DEFAULT_RETURN_MANAGEMENT_CONFIGURATION: ReturnManagementConfiguration = {
  enabled: true,
  returnEligibilityRulesEnabled: true,
  supplierReturnRulesEnabled: true,
  carrierReturnRulesEnabled: true,
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

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadReturnManagementConfigFile(
  repositoryRoot: string,
): Partial<ReturnManagementConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "return-management.config.json"),
    join(repositoryRoot, "config", "return-management.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ReturnManagementConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildReturnManagementConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ReturnManagementConfiguration> = {},
): ReturnManagementConfiguration {
  const fileConfig = repositoryRoot ? loadReturnManagementConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ReturnManagementConfiguration> = {
    enabled: envBool(
      "RETURN_MANAGEMENT_ENABLED",
      DEFAULT_RETURN_MANAGEMENT_CONFIGURATION.enabled,
    ),
    loggingLevel: envString(
      "RETURN_MANAGEMENT_LOG_LEVEL",
      DEFAULT_RETURN_MANAGEMENT_CONFIGURATION.loggingLevel,
    ) as ReturnManagementConfiguration["loggingLevel"],
    autoRecover: envBool(
      "RETURN_MANAGEMENT_AUTO_RECOVER",
      DEFAULT_RETURN_MANAGEMENT_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_RETURN_MANAGEMENT_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
