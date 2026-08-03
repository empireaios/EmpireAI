/** X2-17 — Externalized Company Lifecycle Manager configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CompanyLifecycleManagerConfiguration = {
  enabled: boolean;
  lifecycleTransitionRulesEnabled: boolean;
  maturityAssessmentRulesEnabled: boolean;
  retirementPoliciesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverTransitionLifecycleStagesAutomaticallyBeyondConfiguredApprovalPolicies: true;
  requireApprovalForLifecycleTransitions: boolean;
  preserveLifecycleTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
  launchToGrowthMaturityThreshold: number;
  growthToMatureMaturityThreshold: number;
  matureToRetirementMaturityThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_COMPANY_LIFECYCLE_MANAGER_CONFIGURATION: CompanyLifecycleManagerConfiguration =
  {
    enabled: true,
    lifecycleTransitionRulesEnabled: true,
    maturityAssessmentRulesEnabled: true,
    retirementPoliciesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverTransitionLifecycleStagesAutomaticallyBeyondConfiguredApprovalPolicies: true,
    requireApprovalForLifecycleTransitions: true,
    preserveLifecycleTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
    launchToGrowthMaturityThreshold: 35,
    growthToMatureMaturityThreshold: 65,
    matureToRetirementMaturityThreshold: 20,
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

export function loadCompanyLifecycleManagerConfigFile(
  repositoryRoot: string,
): Partial<CompanyLifecycleManagerConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "company-lifecycle-manager.config.json"),
    join(repositoryRoot, "config", "company-lifecycle-manager.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CompanyLifecycleManagerConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCompanyLifecycleManagerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CompanyLifecycleManagerConfiguration> = {},
): CompanyLifecycleManagerConfiguration {
  const fileConfig = repositoryRoot
    ? loadCompanyLifecycleManagerConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CompanyLifecycleManagerConfiguration> = {
    enabled: envBool(
      "COMPANY_LIFECYCLE_MANAGER_ENABLED",
      DEFAULT_COMPANY_LIFECYCLE_MANAGER_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "COMPANY_LIFECYCLE_MANAGER_TIMEOUT_MS",
      DEFAULT_COMPANY_LIFECYCLE_MANAGER_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "COMPANY_LIFECYCLE_MANAGER_MAX_RETRIES",
      DEFAULT_COMPANY_LIFECYCLE_MANAGER_CONFIGURATION.maxRetryAttempts,
    ),
    growthToMatureMaturityThreshold: envInt(
      "COMPANY_LIFECYCLE_MANAGER_MATURE_THRESHOLD",
      DEFAULT_COMPANY_LIFECYCLE_MANAGER_CONFIGURATION.growthToMatureMaturityThreshold,
    ),
    loggingLevel: envString(
      "COMPANY_LIFECYCLE_MANAGER_LOG_LEVEL",
      DEFAULT_COMPANY_LIFECYCLE_MANAGER_CONFIGURATION.loggingLevel,
    ) as CompanyLifecycleManagerConfiguration["loggingLevel"],
    autoRecover: envBool(
      "COMPANY_LIFECYCLE_MANAGER_AUTO_RECOVER",
      DEFAULT_COMPANY_LIFECYCLE_MANAGER_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_COMPANY_LIFECYCLE_MANAGER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverTransitionLifecycleStagesAutomaticallyBeyondConfiguredApprovalPolicies: true,
    preserveLifecycleTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
