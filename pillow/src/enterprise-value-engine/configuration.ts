/** X2-19 — Externalized Enterprise Value Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { VALUATION_METHODOLOGIES } from "./paths.js";

export type EnterpriseValueEngineConfiguration = {
  enabled: boolean;
  valuationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverRepresentEstimatedValuesAsGuaranteedMarketPrices: true;
  preserveValuationTraceability: true;
  preserveAuditability: true;
  preserveFinancialIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveFinancialInformation: true;
  valuationMethodology: (typeof VALUATION_METHODOLOGIES)[number];
  minimumConfidenceThreshold: number;
  highConfidenceThreshold: number;
  anomalyDeviationThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_ENTERPRISE_VALUE_ENGINE_CONFIGURATION: EnterpriseValueEngineConfiguration =
  {
    enabled: true,
    valuationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRepresentEstimatedValuesAsGuaranteedMarketPrices: true,
    preserveValuationTraceability: true,
    preserveAuditability: true,
    preserveFinancialIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveFinancialInformation: true,
    valuationMethodology: "structural_composite",
    minimumConfidenceThreshold: 40,
    highConfidenceThreshold: 75,
    anomalyDeviationThreshold: 25,
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

export function loadEnterpriseValueEngineConfigFile(
  repositoryRoot: string,
): Partial<EnterpriseValueEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "enterprise-value-engine.config.json"),
    join(repositoryRoot, "config", "enterprise-value-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<EnterpriseValueEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildEnterpriseValueEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EnterpriseValueEngineConfiguration> = {},
): EnterpriseValueEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadEnterpriseValueEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<EnterpriseValueEngineConfiguration> = {
    enabled: envBool(
      "ENTERPRISE_VALUE_ENGINE_ENABLED",
      DEFAULT_ENTERPRISE_VALUE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "ENTERPRISE_VALUE_ENGINE_TIMEOUT_MS",
      DEFAULT_ENTERPRISE_VALUE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "ENTERPRISE_VALUE_ENGINE_MAX_RETRIES",
      DEFAULT_ENTERPRISE_VALUE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    highConfidenceThreshold: envInt(
      "ENTERPRISE_VALUE_ENGINE_HIGH_CONFIDENCE_THRESHOLD",
      DEFAULT_ENTERPRISE_VALUE_ENGINE_CONFIGURATION.highConfidenceThreshold,
    ),
    anomalyDeviationThreshold: envInt(
      "ENTERPRISE_VALUE_ENGINE_ANOMALY_THRESHOLD",
      DEFAULT_ENTERPRISE_VALUE_ENGINE_CONFIGURATION.anomalyDeviationThreshold,
    ),
    loggingLevel: envString(
      "ENTERPRISE_VALUE_ENGINE_LOG_LEVEL",
      DEFAULT_ENTERPRISE_VALUE_ENGINE_CONFIGURATION.loggingLevel,
    ) as EnterpriseValueEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "ENTERPRISE_VALUE_ENGINE_AUTO_RECOVER",
      DEFAULT_ENTERPRISE_VALUE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_ENTERPRISE_VALUE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRepresentEstimatedValuesAsGuaranteedMarketPrices: true,
    preserveValuationTraceability: true,
    preserveAuditability: true,
    preserveFinancialIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveFinancialInformation: true,
  };
}
