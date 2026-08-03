/** X4-05 — Externalized Currency Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_SUPPORTED_CURRENCIES } from "./paths.js";

export type CurrencyIntelligenceConfiguration = {
  enabled: boolean;
  supportedCurrencies: string[];
  exchangeRateRefreshRulesEnabled: boolean;
  regionalPricingRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverPerformFinancialConversionsUsingUnvalidatedExchangeData: true;
  preserveFinancialTraceability: true;
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
  fluctuationAlertThresholdPercent: number;
};

export const DEFAULT_CURRENCY_INTELLIGENCE_CONFIGURATION: CurrencyIntelligenceConfiguration = {
  enabled: true,
  supportedCurrencies: [...DEFAULT_SUPPORTED_CURRENCIES],
  exchangeRateRefreshRulesEnabled: true,
  regionalPricingRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  neverPerformFinancialConversionsUsingUnvalidatedExchangeData: true,
  preserveFinancialTraceability: true,
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
  fluctuationAlertThresholdPercent: 8,
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

function envCurrencies(fallback: string[]): string[] {
  const v = process.env.CURRENCY_INTELLIGENCE_SUPPORTED_CURRENCIES;
  if (!v?.trim()) return fallback;
  return v
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

export function loadCurrencyIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<CurrencyIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "currency-intelligence.config.json"),
    join(repositoryRoot, "config", "currency-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<CurrencyIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCurrencyIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CurrencyIntelligenceConfiguration> = {},
): CurrencyIntelligenceConfiguration {
  const fileConfig = repositoryRoot ? loadCurrencyIntelligenceConfigFile(repositoryRoot) : null;
  const envConfig: Partial<CurrencyIntelligenceConfiguration> = {
    enabled: envBool(
      "CURRENCY_INTELLIGENCE_ENABLED",
      DEFAULT_CURRENCY_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    supportedCurrencies: envCurrencies(
      DEFAULT_CURRENCY_INTELLIGENCE_CONFIGURATION.supportedCurrencies,
    ),
    connectionTimeoutMs: envInt(
      "CURRENCY_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_CURRENCY_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CURRENCY_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_CURRENCY_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "CURRENCY_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_CURRENCY_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as CurrencyIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CURRENCY_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_CURRENCY_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
    fluctuationAlertThresholdPercent: envInt(
      "CURRENCY_INTELLIGENCE_FLUCTUATION_THRESHOLD",
      DEFAULT_CURRENCY_INTELLIGENCE_CONFIGURATION.fluctuationAlertThresholdPercent,
    ),
  };

  return {
    ...DEFAULT_CURRENCY_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverPerformFinancialConversionsUsingUnvalidatedExchangeData: true,
    preserveFinancialTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveFinancialInformation: true,
  };
}
