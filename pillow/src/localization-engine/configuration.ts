/** X4-03 — Externalized Localization Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type LocalizationEngineConfiguration = {
  enabled: boolean;
  localizationRulesEnabled: boolean;
  regionalAdaptationRulesEnabled: boolean;
  readinessThreshold: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverOverwriteCanonicalSourceContent: true;
  preserveLocalizationTraceability: true;
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

export const DEFAULT_LOCALIZATION_ENGINE_CONFIGURATION: LocalizationEngineConfiguration = {
  enabled: true,
  localizationRulesEnabled: true,
  regionalAdaptationRulesEnabled: true,
  readinessThreshold: 55,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverOverwriteCanonicalSourceContent: true,
  preserveLocalizationTraceability: true,
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

export function loadLocalizationEngineConfigFile(
  repositoryRoot: string,
): Partial<LocalizationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "localization-engine.config.json"),
    join(repositoryRoot, "config", "localization-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<LocalizationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildLocalizationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LocalizationEngineConfiguration> = {},
): LocalizationEngineConfiguration {
  const fileConfig = repositoryRoot ? loadLocalizationEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<LocalizationEngineConfiguration> = {
    enabled: envBool(
      "LOCALIZATION_ENGINE_ENABLED",
      DEFAULT_LOCALIZATION_ENGINE_CONFIGURATION.enabled,
    ),
    readinessThreshold: envInt(
      "LOCALIZATION_ENGINE_READINESS_THRESHOLD",
      DEFAULT_LOCALIZATION_ENGINE_CONFIGURATION.readinessThreshold,
    ),
    connectionTimeoutMs: envInt(
      "LOCALIZATION_ENGINE_TIMEOUT_MS",
      DEFAULT_LOCALIZATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "LOCALIZATION_ENGINE_MAX_RETRIES",
      DEFAULT_LOCALIZATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "LOCALIZATION_ENGINE_LOG_LEVEL",
      DEFAULT_LOCALIZATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as LocalizationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "LOCALIZATION_ENGINE_AUTO_RECOVER",
      DEFAULT_LOCALIZATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_LOCALIZATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverOverwriteCanonicalSourceContent: true,
    preserveLocalizationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
