/** X4-12 — Externalized International Partnership Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type InternationalPartnershipEngineConfiguration = {
  enabled: boolean;
  partnerEvaluationRulesEnabled: boolean;
  partnershipGovernanceRulesEnabled: boolean;
  performanceThreshold: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverApproveStrategicPartnershipsWithoutValidation: true;
  preservePartnershipTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitivePartnershipInformation: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_INTERNATIONAL_PARTNERSHIP_ENGINE_CONFIGURATION: InternationalPartnershipEngineConfiguration =
  {
    enabled: true,
    partnerEvaluationRulesEnabled: true,
    partnershipGovernanceRulesEnabled: true,
    performanceThreshold: 55,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverApproveStrategicPartnershipsWithoutValidation: true,
    preservePartnershipTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitivePartnershipInformation: true,
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

export function loadInternationalPartnershipEngineConfigFile(
  repositoryRoot: string,
): Partial<InternationalPartnershipEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "international-partnership-engine.config.json"),
    join(repositoryRoot, "config", "international-partnership-engine.config.json"),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      return JSON.parse(
        readFileSync(candidate, "utf8"),
      ) as Partial<InternationalPartnershipEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildInternationalPartnershipEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<InternationalPartnershipEngineConfiguration> = {},
): InternationalPartnershipEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadInternationalPartnershipEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<InternationalPartnershipEngineConfiguration> = {
    enabled: envBool(
      "INTERNATIONAL_PARTNERSHIP_ENGINE_ENABLED",
      DEFAULT_INTERNATIONAL_PARTNERSHIP_ENGINE_CONFIGURATION.enabled,
    ),
    performanceThreshold: envInt(
      "INTERNATIONAL_PARTNERSHIP_ENGINE_PERFORMANCE_THRESHOLD",
      DEFAULT_INTERNATIONAL_PARTNERSHIP_ENGINE_CONFIGURATION.performanceThreshold,
    ),
    connectionTimeoutMs: envInt(
      "INTERNATIONAL_PARTNERSHIP_ENGINE_TIMEOUT_MS",
      DEFAULT_INTERNATIONAL_PARTNERSHIP_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "INTERNATIONAL_PARTNERSHIP_ENGINE_MAX_RETRIES",
      DEFAULT_INTERNATIONAL_PARTNERSHIP_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "INTERNATIONAL_PARTNERSHIP_ENGINE_LOG_LEVEL",
      DEFAULT_INTERNATIONAL_PARTNERSHIP_ENGINE_CONFIGURATION.loggingLevel,
    ) as InternationalPartnershipEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "INTERNATIONAL_PARTNERSHIP_ENGINE_AUTO_RECOVER",
      DEFAULT_INTERNATIONAL_PARTNERSHIP_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_INTERNATIONAL_PARTNERSHIP_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverApproveStrategicPartnershipsWithoutValidation: true,
    preservePartnershipTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitivePartnershipInformation: true,
  };
}
