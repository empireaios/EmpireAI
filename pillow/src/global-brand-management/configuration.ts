/** X4-11 — Externalized Global Brand Management configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type GlobalBrandManagementConfiguration = {
  enabled: boolean;
  brandGovernanceRulesEnabled: boolean;
  regionalAdaptationRulesEnabled: boolean;
  reputationThreshold: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverModifyProtectedBrandAssetsWithoutAuthorization: true;
  preserveBrandTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveBrandInformation: true;
  requireAuthorizationForProtectedAssets: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_GLOBAL_BRAND_MANAGEMENT_CONFIGURATION: GlobalBrandManagementConfiguration =
  {
    enabled: true,
    brandGovernanceRulesEnabled: true,
    regionalAdaptationRulesEnabled: true,
    reputationThreshold: 55,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverModifyProtectedBrandAssetsWithoutAuthorization: true,
    preserveBrandTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveBrandInformation: true,
    requireAuthorizationForProtectedAssets: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
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

export function loadGlobalBrandManagementConfigFile(
  repositoryRoot: string,
): Partial<GlobalBrandManagementConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "global-brand-management.config.json"),
    join(repositoryRoot, "config", "global-brand-management.config.json"),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      return JSON.parse(
        readFileSync(candidate, "utf8"),
      ) as Partial<GlobalBrandManagementConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildGlobalBrandManagementConfiguration(
  repositoryRoot?: string,
  overrides: Partial<GlobalBrandManagementConfiguration> = {},
): GlobalBrandManagementConfiguration {
  const fileConfig = repositoryRoot
    ? loadGlobalBrandManagementConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<GlobalBrandManagementConfiguration> = {
    enabled: envBool(
      "GLOBAL_BRAND_MANAGEMENT_ENABLED",
      DEFAULT_GLOBAL_BRAND_MANAGEMENT_CONFIGURATION.enabled,
    ),
    reputationThreshold: envInt(
      "GLOBAL_BRAND_MANAGEMENT_REPUTATION_THRESHOLD",
      DEFAULT_GLOBAL_BRAND_MANAGEMENT_CONFIGURATION.reputationThreshold,
    ),
    connectionTimeoutMs: envInt(
      "GLOBAL_BRAND_MANAGEMENT_TIMEOUT_MS",
      DEFAULT_GLOBAL_BRAND_MANAGEMENT_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "GLOBAL_BRAND_MANAGEMENT_MAX_RETRIES",
      DEFAULT_GLOBAL_BRAND_MANAGEMENT_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "GLOBAL_BRAND_MANAGEMENT_LOG_LEVEL",
      DEFAULT_GLOBAL_BRAND_MANAGEMENT_CONFIGURATION.loggingLevel,
    ) as GlobalBrandManagementConfiguration["loggingLevel"],
    autoRecover: envBool(
      "GLOBAL_BRAND_MANAGEMENT_AUTO_RECOVER",
      DEFAULT_GLOBAL_BRAND_MANAGEMENT_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_GLOBAL_BRAND_MANAGEMENT_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverModifyProtectedBrandAssetsWithoutAuthorization: true,
    preserveBrandTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveBrandInformation: true,
    requireAuthorizationForProtectedAssets: true,
  };
}
