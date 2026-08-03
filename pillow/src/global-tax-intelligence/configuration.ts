/** X4-07 — Externalized Global Tax Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type GlobalTaxIntelligenceConfiguration = {
  enabled: boolean;
  taxUpdateRulesEnabled: boolean;
  taxCalculationRulesEnabled: boolean;
  riskThreshold: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverProvideUnvalidatedTaxAsLegalAdvice: true;
  preserveTaxCalculationTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveFinancialInformation: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_GLOBAL_TAX_INTELLIGENCE_CONFIGURATION: GlobalTaxIntelligenceConfiguration =
  {
    enabled: true,
    taxUpdateRulesEnabled: true,
    taxCalculationRulesEnabled: true,
    riskThreshold: 55,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverProvideUnvalidatedTaxAsLegalAdvice: true,
    preserveTaxCalculationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveFinancialInformation: true,
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

export function loadGlobalTaxIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<GlobalTaxIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "global-tax-intelligence.config.json"),
    join(repositoryRoot, "config", "global-tax-intelligence.config.json"),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      return JSON.parse(
        readFileSync(candidate, "utf8"),
      ) as Partial<GlobalTaxIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildGlobalTaxIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<GlobalTaxIntelligenceConfiguration> = {},
): GlobalTaxIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadGlobalTaxIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<GlobalTaxIntelligenceConfiguration> = {
    enabled: envBool(
      "GLOBAL_TAX_INTELLIGENCE_ENABLED",
      DEFAULT_GLOBAL_TAX_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    riskThreshold: envInt(
      "GLOBAL_TAX_INTELLIGENCE_RISK_THRESHOLD",
      DEFAULT_GLOBAL_TAX_INTELLIGENCE_CONFIGURATION.riskThreshold,
    ),
    connectionTimeoutMs: envInt(
      "GLOBAL_TAX_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_GLOBAL_TAX_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "GLOBAL_TAX_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_GLOBAL_TAX_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "GLOBAL_TAX_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_GLOBAL_TAX_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as GlobalTaxIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "GLOBAL_TAX_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_GLOBAL_TAX_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_GLOBAL_TAX_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverProvideUnvalidatedTaxAsLegalAdvice: true,
    preserveTaxCalculationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveFinancialInformation: true,
  };
}
