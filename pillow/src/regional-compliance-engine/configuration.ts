/** X4-06 — Externalized Regional Compliance Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type RegionalComplianceEngineConfiguration = {
  enabled: boolean;
  regulatoryUpdateRulesEnabled: boolean;
  complianceValidationRulesEnabled: boolean;
  riskThreshold: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverFalselyCertifyCompliance: true;
  preserveRegulatoryTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveComplianceInformation: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_REGIONAL_COMPLIANCE_ENGINE_CONFIGURATION: RegionalComplianceEngineConfiguration =
  {
    enabled: true,
    regulatoryUpdateRulesEnabled: true,
    complianceValidationRulesEnabled: true,
    riskThreshold: 55,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverFalselyCertifyCompliance: true,
    preserveRegulatoryTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveComplianceInformation: true,
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

export function loadRegionalComplianceEngineConfigFile(
  repositoryRoot: string,
): Partial<RegionalComplianceEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "regional-compliance-engine.config.json"),
    join(repositoryRoot, "config", "regional-compliance-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<RegionalComplianceEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildRegionalComplianceEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RegionalComplianceEngineConfiguration> = {},
): RegionalComplianceEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadRegionalComplianceEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<RegionalComplianceEngineConfiguration> = {
    enabled: envBool(
      "REGIONAL_COMPLIANCE_ENGINE_ENABLED",
      DEFAULT_REGIONAL_COMPLIANCE_ENGINE_CONFIGURATION.enabled,
    ),
    riskThreshold: envInt(
      "REGIONAL_COMPLIANCE_ENGINE_RISK_THRESHOLD",
      DEFAULT_REGIONAL_COMPLIANCE_ENGINE_CONFIGURATION.riskThreshold,
    ),
    connectionTimeoutMs: envInt(
      "REGIONAL_COMPLIANCE_ENGINE_TIMEOUT_MS",
      DEFAULT_REGIONAL_COMPLIANCE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "REGIONAL_COMPLIANCE_ENGINE_MAX_RETRIES",
      DEFAULT_REGIONAL_COMPLIANCE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "REGIONAL_COMPLIANCE_ENGINE_LOG_LEVEL",
      DEFAULT_REGIONAL_COMPLIANCE_ENGINE_CONFIGURATION.loggingLevel,
    ) as RegionalComplianceEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "REGIONAL_COMPLIANCE_ENGINE_AUTO_RECOVER",
      DEFAULT_REGIONAL_COMPLIANCE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_REGIONAL_COMPLIANCE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverFalselyCertifyCompliance: true,
    preserveRegulatoryTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveComplianceInformation: true,
  };
}
