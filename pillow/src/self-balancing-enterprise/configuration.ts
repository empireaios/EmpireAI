/** X3-19 — Externalized Self-Balancing Enterprise configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SelfBalancingEnterpriseConfiguration = {
  enabled: boolean;
  balancingRulesEnabled: boolean;
  enterpriseResourceUtilizationMonitoringEnabled: boolean;
  operationalBalanceMonitoringEnabled: boolean;
  financialBalanceMonitoringEnabled: boolean;
  workforceBalanceMonitoringEnabled: boolean;
  supplierBalanceMonitoringEnabled: boolean;
  infrastructureBalanceMonitoringEnabled: boolean;
  resourceImbalanceDetectionEnabled: boolean;
  policyGatedResourceReallocationEnabled: boolean;
  enterpriseEquilibriumOptimizationEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverReallocateProtectedResourcesBeyondApprovalPolicies: true;
  preserveBalancingTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
  balanceScoreThreshold: number;
  highScoreThreshold: number;
  criticalScoreThreshold: number;
  operationalBalanceThreshold: number;
  financialBalanceThreshold: number;
  workforceBalanceThreshold: number;
  supplierBalanceThreshold: number;
  infrastructureBalanceThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_SELF_BALANCING_ENTERPRISE_CONFIGURATION: SelfBalancingEnterpriseConfiguration =
  {
    enabled: true,
    balancingRulesEnabled: true,
    enterpriseResourceUtilizationMonitoringEnabled: true,
    operationalBalanceMonitoringEnabled: true,
    financialBalanceMonitoringEnabled: true,
    workforceBalanceMonitoringEnabled: true,
    supplierBalanceMonitoringEnabled: true,
    infrastructureBalanceMonitoringEnabled: true,
    resourceImbalanceDetectionEnabled: true,
    policyGatedResourceReallocationEnabled: true,
    enterpriseEquilibriumOptimizationEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverReallocateProtectedResourcesBeyondApprovalPolicies: true,
    preserveBalancingTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
    balanceScoreThreshold: 55,
    highScoreThreshold: 70,
    criticalScoreThreshold: 85,
    operationalBalanceThreshold: 60,
    financialBalanceThreshold: 60,
    workforceBalanceThreshold: 60,
    supplierBalanceThreshold: 60,
    infrastructureBalanceThreshold: 60,
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

export function loadSelfBalancingEnterpriseConfigFile(
  repositoryRoot: string,
): Partial<SelfBalancingEnterpriseConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "self-balancing-enterprise.config.json"),
    join(repositoryRoot, "config", "self-balancing-enterprise.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<SelfBalancingEnterpriseConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSelfBalancingEnterpriseConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SelfBalancingEnterpriseConfiguration> = {},
): SelfBalancingEnterpriseConfiguration {
  const fileConfig = repositoryRoot
    ? loadSelfBalancingEnterpriseConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<SelfBalancingEnterpriseConfiguration> = {
    enabled: envBool(
      "SELF_BALANCING_ENTERPRISE_ENABLED",
      DEFAULT_SELF_BALANCING_ENTERPRISE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "SELF_BALANCING_ENTERPRISE_TIMEOUT_MS",
      DEFAULT_SELF_BALANCING_ENTERPRISE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SELF_BALANCING_ENTERPRISE_MAX_RETRIES",
      DEFAULT_SELF_BALANCING_ENTERPRISE_CONFIGURATION.maxRetryAttempts,
    ),
    balanceScoreThreshold: envInt(
      "SELF_BALANCING_ENTERPRISE_SCORE_THRESHOLD",
      DEFAULT_SELF_BALANCING_ENTERPRISE_CONFIGURATION.balanceScoreThreshold,
    ),
    highScoreThreshold: envInt(
      "SELF_BALANCING_ENTERPRISE_HIGH_SCORE",
      DEFAULT_SELF_BALANCING_ENTERPRISE_CONFIGURATION.highScoreThreshold,
    ),
    criticalScoreThreshold: envInt(
      "SELF_BALANCING_ENTERPRISE_CRITICAL_SCORE",
      DEFAULT_SELF_BALANCING_ENTERPRISE_CONFIGURATION.criticalScoreThreshold,
    ),
    loggingLevel: envString(
      "SELF_BALANCING_ENTERPRISE_LOG_LEVEL",
      DEFAULT_SELF_BALANCING_ENTERPRISE_CONFIGURATION.loggingLevel,
    ) as SelfBalancingEnterpriseConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SELF_BALANCING_ENTERPRISE_AUTO_RECOVER",
      DEFAULT_SELF_BALANCING_ENTERPRISE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SELF_BALANCING_ENTERPRISE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverReallocateProtectedResourcesBeyondApprovalPolicies: true,
    preserveBalancingTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
