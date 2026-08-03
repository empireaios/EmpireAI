/** X2-11 — Externalized Cross-Company Resource Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CrossCompanyResourceEngineConfiguration = {
  enabled: boolean;
  resourceAllocationRulesEnabled: boolean;
  resourceSharingPoliciesEnabled: boolean;
  optimizationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverAllocateProtectedResourcesWithoutAuthorization: true;
  preserveAllocationTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  idleUtilizationThreshold: number;
  conflictUtilizationThreshold: number;
  maxAllocationsPerResource: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_CROSS_COMPANY_RESOURCE_ENGINE_CONFIGURATION: CrossCompanyResourceEngineConfiguration =
  {
    enabled: true,
    resourceAllocationRulesEnabled: true,
    resourceSharingPoliciesEnabled: true,
    optimizationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverAllocateProtectedResourcesWithoutAuthorization: true,
    preserveAllocationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    idleUtilizationThreshold: 20,
    conflictUtilizationThreshold: 95,
    maxAllocationsPerResource: 4,
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

export function loadCrossCompanyResourceEngineConfigFile(
  repositoryRoot: string,
): Partial<CrossCompanyResourceEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "cross-company-resource-engine.config.json"),
    join(repositoryRoot, "config", "cross-company-resource-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CrossCompanyResourceEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCrossCompanyResourceEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CrossCompanyResourceEngineConfiguration> = {},
): CrossCompanyResourceEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadCrossCompanyResourceEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CrossCompanyResourceEngineConfiguration> = {
    enabled: envBool(
      "CROSS_COMPANY_RESOURCE_ENGINE_ENABLED",
      DEFAULT_CROSS_COMPANY_RESOURCE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CROSS_COMPANY_RESOURCE_ENGINE_TIMEOUT_MS",
      DEFAULT_CROSS_COMPANY_RESOURCE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CROSS_COMPANY_RESOURCE_ENGINE_MAX_RETRIES",
      DEFAULT_CROSS_COMPANY_RESOURCE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    idleUtilizationThreshold: envInt(
      "CROSS_COMPANY_RESOURCE_ENGINE_IDLE_THRESHOLD",
      DEFAULT_CROSS_COMPANY_RESOURCE_ENGINE_CONFIGURATION.idleUtilizationThreshold,
    ),
    loggingLevel: envString(
      "CROSS_COMPANY_RESOURCE_ENGINE_LOG_LEVEL",
      DEFAULT_CROSS_COMPANY_RESOURCE_ENGINE_CONFIGURATION.loggingLevel,
    ) as CrossCompanyResourceEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CROSS_COMPANY_RESOURCE_ENGINE_AUTO_RECOVER",
      DEFAULT_CROSS_COMPANY_RESOURCE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CROSS_COMPANY_RESOURCE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverAllocateProtectedResourcesWithoutAuthorization: true,
    preserveAllocationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
