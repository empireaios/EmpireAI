/** X4-04 — Externalized Language Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_SUPPORTED_LANGUAGES } from "./paths.js";

export type LanguageIntelligenceConfiguration = {
  enabled: boolean;
  supportedLanguages: string[];
  translationRulesEnabled: boolean;
  qualityThreshold: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverOverwriteCanonicalSourceContentAutomatically: true;
  preserveTranslationTraceability: true;
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

export const DEFAULT_LANGUAGE_INTELLIGENCE_CONFIGURATION: LanguageIntelligenceConfiguration = {
  enabled: true,
  supportedLanguages: [...DEFAULT_SUPPORTED_LANGUAGES],
  translationRulesEnabled: true,
  qualityThreshold: 60,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverOverwriteCanonicalSourceContentAutomatically: true,
  preserveTranslationTraceability: true,
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

function envLanguages(fallback: string[]): string[] {
  const v = process.env.LANGUAGE_INTELLIGENCE_SUPPORTED_LANGUAGES;
  if (!v?.trim()) return fallback;
  return v
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function loadLanguageIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<LanguageIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "language-intelligence.config.json"),
    join(repositoryRoot, "config", "language-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<LanguageIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildLanguageIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LanguageIntelligenceConfiguration> = {},
): LanguageIntelligenceConfiguration {
  const fileConfig = repositoryRoot ? loadLanguageIntelligenceConfigFile(repositoryRoot) : null;
  const envConfig: Partial<LanguageIntelligenceConfiguration> = {
    enabled: envBool(
      "LANGUAGE_INTELLIGENCE_ENABLED",
      DEFAULT_LANGUAGE_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    supportedLanguages: envLanguages(
      DEFAULT_LANGUAGE_INTELLIGENCE_CONFIGURATION.supportedLanguages,
    ),
    qualityThreshold: envInt(
      "LANGUAGE_INTELLIGENCE_QUALITY_THRESHOLD",
      DEFAULT_LANGUAGE_INTELLIGENCE_CONFIGURATION.qualityThreshold,
    ),
    connectionTimeoutMs: envInt(
      "LANGUAGE_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_LANGUAGE_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "LANGUAGE_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_LANGUAGE_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "LANGUAGE_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_LANGUAGE_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as LanguageIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "LANGUAGE_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_LANGUAGE_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_LANGUAGE_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverOverwriteCanonicalSourceContentAutomatically: true,
    preserveTranslationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
