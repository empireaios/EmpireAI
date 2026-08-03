/** X2-02 — Externalized Multi-Company Registry configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type MultiCompanyRegistryConfiguration = {
  enabled: boolean;
  registrationRulesEnabled: boolean;
  classificationRulesEnabled: boolean;
  lifecycleRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverRegisterDuplicatesWithoutValidation: true;
  preserveCompanyTraceability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxRegisteredCompanies: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_MULTI_COMPANY_REGISTRY_CONFIGURATION: MultiCompanyRegistryConfiguration = {
  enabled: true,
  registrationRulesEnabled: true,
  classificationRulesEnabled: true,
  lifecycleRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverExposeCredentials: true,
  neverRegisterDuplicatesWithoutValidation: true,
  preserveCompanyTraceability: true,
  preserveEnterpriseIntegrity: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  maxRegisteredCompanies: 200,
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

export function loadMultiCompanyRegistryConfigFile(
  repositoryRoot: string,
): Partial<MultiCompanyRegistryConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "multi-company-registry.config.json"),
    join(repositoryRoot, "config", "multi-company-registry.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<MultiCompanyRegistryConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMultiCompanyRegistryConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MultiCompanyRegistryConfiguration> = {},
): MultiCompanyRegistryConfiguration {
  const fileConfig = repositoryRoot
    ? loadMultiCompanyRegistryConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<MultiCompanyRegistryConfiguration> = {
    enabled: envBool(
      "MULTI_COMPANY_REGISTRY_ENABLED",
      DEFAULT_MULTI_COMPANY_REGISTRY_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "MULTI_COMPANY_REGISTRY_TIMEOUT_MS",
      DEFAULT_MULTI_COMPANY_REGISTRY_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "MULTI_COMPANY_REGISTRY_MAX_RETRIES",
      DEFAULT_MULTI_COMPANY_REGISTRY_CONFIGURATION.maxRetryAttempts,
    ),
    maxRegisteredCompanies: envInt(
      "MULTI_COMPANY_REGISTRY_MAX_COMPANIES",
      DEFAULT_MULTI_COMPANY_REGISTRY_CONFIGURATION.maxRegisteredCompanies,
    ),
    loggingLevel: envString(
      "MULTI_COMPANY_REGISTRY_LOG_LEVEL",
      DEFAULT_MULTI_COMPANY_REGISTRY_CONFIGURATION.loggingLevel,
    ) as MultiCompanyRegistryConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MULTI_COMPANY_REGISTRY_AUTO_RECOVER",
      DEFAULT_MULTI_COMPANY_REGISTRY_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_MULTI_COMPANY_REGISTRY_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverRegisterDuplicatesWithoutValidation: true,
    preserveCompanyTraceability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
