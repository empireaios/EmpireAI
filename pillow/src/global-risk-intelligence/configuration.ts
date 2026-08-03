/** X4-14 — Externalized Global Risk Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type GlobalRiskIntelligenceConfiguration = {
  enabled: boolean;
  regionalOptimizationRulesEnabled: boolean;
  performanceThreshold: number;
  priorityCalculationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverSuppressCriticalInternationalRisks: true;
  neverMakeDecisionsUsingUnvalidatedRiskIntelligence: true;
  preserveRiskTraceability: true;
  neverOptimizeUsingUnvalidatedRegionalIntelligence: true;
  preserveOptimizationTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_GLOBAL_RISK_INTELLIGENCE_CONFIGURATION: GlobalRiskIntelligenceConfiguration =
  {
    enabled: true,
    regionalOptimizationRulesEnabled: true,
    performanceThreshold: 55,
    priorityCalculationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverSuppressCriticalInternationalRisks: true,
    neverMakeDecisionsUsingUnvalidatedRiskIntelligence: true,
    preserveRiskTraceability: true,
    neverOptimizeUsingUnvalidatedRegionalIntelligence: true,
    preserveOptimizationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
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

export function loadGlobalRiskIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<GlobalRiskIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "global-risk-intelligence.config.json"),
    join(repositoryRoot, "config", "global-risk-intelligence.config.json"),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      return JSON.parse(
        readFileSync(candidate, "utf8"),
      ) as Partial<GlobalRiskIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildGlobalRiskIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<GlobalRiskIntelligenceConfiguration> = {},
): GlobalRiskIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadGlobalRiskIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<GlobalRiskIntelligenceConfiguration> = {
    enabled: envBool(
      "GLOBAL_RISK_INTELLIGENCE_ENABLED",
      DEFAULT_GLOBAL_RISK_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    performanceThreshold: envInt(
      "GLOBAL_RISK_INTELLIGENCE_PERFORMANCE_THRESHOLD",
      DEFAULT_GLOBAL_RISK_INTELLIGENCE_CONFIGURATION.performanceThreshold,
    ),
    connectionTimeoutMs: envInt(
      "GLOBAL_RISK_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_GLOBAL_RISK_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "GLOBAL_RISK_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_GLOBAL_RISK_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "GLOBAL_RISK_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_GLOBAL_RISK_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as GlobalRiskIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "GLOBAL_RISK_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_GLOBAL_RISK_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_GLOBAL_RISK_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverSuppressCriticalInternationalRisks: true,
    neverMakeDecisionsUsingUnvalidatedRiskIntelligence: true,
    preserveRiskTraceability: true,
    neverOptimizeUsingUnvalidatedRegionalIntelligence: true,
    preserveOptimizationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
