/** X4-02 — Externalized Country Intelligence Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CountryIntelligenceEngineConfiguration = {
  enabled: boolean;
  evaluationRulesEnabled: boolean;
  rankingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverRecommendUsingUnvalidatedCountryData: true;
  preserveEvaluationTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  readinessThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_COUNTRY_INTELLIGENCE_ENGINE_CONFIGURATION: CountryIntelligenceEngineConfiguration =
  {
    enabled: true,
    evaluationRulesEnabled: true,
    rankingRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendUsingUnvalidatedCountryData: true,
    preserveEvaluationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
    readinessThreshold: 55,
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

export function loadCountryIntelligenceEngineConfigFile(
  repositoryRoot: string,
): Partial<CountryIntelligenceEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "country-intelligence-engine.config.json"),
    join(repositoryRoot, "config", "country-intelligence-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CountryIntelligenceEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCountryIntelligenceEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CountryIntelligenceEngineConfiguration> = {},
): CountryIntelligenceEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadCountryIntelligenceEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CountryIntelligenceEngineConfiguration> = {
    enabled: envBool(
      "COUNTRY_INTELLIGENCE_ENGINE_ENABLED",
      DEFAULT_COUNTRY_INTELLIGENCE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "COUNTRY_INTELLIGENCE_ENGINE_TIMEOUT_MS",
      DEFAULT_COUNTRY_INTELLIGENCE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "COUNTRY_INTELLIGENCE_ENGINE_MAX_RETRIES",
      DEFAULT_COUNTRY_INTELLIGENCE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    readinessThreshold: envInt(
      "COUNTRY_INTELLIGENCE_ENGINE_READINESS_THRESHOLD",
      DEFAULT_COUNTRY_INTELLIGENCE_ENGINE_CONFIGURATION.readinessThreshold,
    ),
    loggingLevel: envString(
      "COUNTRY_INTELLIGENCE_ENGINE_LOG_LEVEL",
      DEFAULT_COUNTRY_INTELLIGENCE_ENGINE_CONFIGURATION.loggingLevel,
    ) as CountryIntelligenceEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "COUNTRY_INTELLIGENCE_ENGINE_AUTO_RECOVER",
      DEFAULT_COUNTRY_INTELLIGENCE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_COUNTRY_INTELLIGENCE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendUsingUnvalidatedCountryData: true,
    preserveEvaluationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
