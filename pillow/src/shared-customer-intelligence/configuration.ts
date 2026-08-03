/** X2-12 — Externalized Shared Customer Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SharedCustomerIntelligenceConfiguration = {
  enabled: boolean;
  customerMatchingRulesEnabled: boolean;
  insightGenerationRulesEnabled: boolean;
  privacyRulesEnabled: true;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverViolateCustomerPrivacyPolicies: true;
  preserveCustomerTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveCustomerInformation: true;
  highValueLtvThreshold: number;
  crossSellAffinityThreshold: number;
  riskScoreThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_SHARED_CUSTOMER_INTELLIGENCE_CONFIGURATION: SharedCustomerIntelligenceConfiguration =
  {
    enabled: true,
    customerMatchingRulesEnabled: true,
    insightGenerationRulesEnabled: true,
    privacyRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverViolateCustomerPrivacyPolicies: true,
    preserveCustomerTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveCustomerInformation: true,
    highValueLtvThreshold: 70,
    crossSellAffinityThreshold: 55,
    riskScoreThreshold: 65,
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

export function loadSharedCustomerIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<SharedCustomerIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "shared-customer-intelligence.config.json"),
    join(repositoryRoot, "config", "shared-customer-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<SharedCustomerIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSharedCustomerIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SharedCustomerIntelligenceConfiguration> = {},
): SharedCustomerIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadSharedCustomerIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<SharedCustomerIntelligenceConfiguration> = {
    enabled: envBool(
      "SHARED_CUSTOMER_INTELLIGENCE_ENABLED",
      DEFAULT_SHARED_CUSTOMER_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "SHARED_CUSTOMER_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_SHARED_CUSTOMER_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SHARED_CUSTOMER_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_SHARED_CUSTOMER_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    highValueLtvThreshold: envInt(
      "SHARED_CUSTOMER_INTELLIGENCE_HIGH_VALUE_LTV",
      DEFAULT_SHARED_CUSTOMER_INTELLIGENCE_CONFIGURATION.highValueLtvThreshold,
    ),
    loggingLevel: envString(
      "SHARED_CUSTOMER_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_SHARED_CUSTOMER_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as SharedCustomerIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SHARED_CUSTOMER_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_SHARED_CUSTOMER_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SHARED_CUSTOMER_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    privacyRulesEnabled: true,
    neverExposeCredentials: true,
    neverViolateCustomerPrivacyPolicies: true,
    preserveCustomerTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveCustomerInformation: true,
  };
}
