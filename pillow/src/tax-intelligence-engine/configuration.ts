/** R3-11 — Externalized Tax Intelligence Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type JurisdictionRateRule = {
  jurisdiction: string;
  category: string;
  rate: number;
};

export type TaxIntelligenceEngineConfiguration = {
  enabled: boolean;
  taxCalculationRulesEnabled: boolean;
  jurisdictionRulesEnabled: boolean;
  taxRateRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultJurisdiction: string;
  defaultTaxRate: number;
  jurisdictionRates: JurisdictionRateRule[];
  maskSensitiveValues: true;
};

export const DEFAULT_TAX_INTELLIGENCE_ENGINE_CONFIGURATION: TaxIntelligenceEngineConfiguration =
  {
    enabled: true,
    taxCalculationRulesEnabled: true,
    jurisdictionRulesEnabled: true,
    taxRateRulesEnabled: true,
    validationRulesEnabled: true,
    anomalyDetectionEnabled: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
    defaultJurisdiction: "US",
    defaultTaxRate: 0.08,
    jurisdictionRates: [
      { jurisdiction: "US", category: "sales_tax", rate: 0.08 },
      { jurisdiction: "EU", category: "vat", rate: 0.2 },
      { jurisdiction: "UK", category: "vat", rate: 0.2 },
      { jurisdiction: "US", category: "refund_adjustment", rate: -0.08 },
    ],
    maskSensitiveValues: true,
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

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadTaxIntelligenceEngineConfigFile(
  repositoryRoot: string,
): Partial<TaxIntelligenceEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "tax-intelligence-engine.config.json"),
    join(repositoryRoot, "config", "tax-intelligence-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<TaxIntelligenceEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildTaxIntelligenceEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<TaxIntelligenceEngineConfiguration> = {},
): TaxIntelligenceEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadTaxIntelligenceEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<TaxIntelligenceEngineConfiguration> = {
    enabled: envBool(
      "TAX_INTELLIGENCE_ENGINE_ENABLED",
      DEFAULT_TAX_INTELLIGENCE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "TAX_INTELLIGENCE_ENGINE_TIMEOUT_MS",
      DEFAULT_TAX_INTELLIGENCE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "TAX_INTELLIGENCE_ENGINE_MAX_RETRIES",
      DEFAULT_TAX_INTELLIGENCE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    defaultTaxRate: envFloat(
      "TAX_INTELLIGENCE_ENGINE_DEFAULT_RATE",
      DEFAULT_TAX_INTELLIGENCE_ENGINE_CONFIGURATION.defaultTaxRate,
    ),
    loggingLevel: envString(
      "TAX_INTELLIGENCE_ENGINE_LOG_LEVEL",
      DEFAULT_TAX_INTELLIGENCE_ENGINE_CONFIGURATION.loggingLevel,
    ) as TaxIntelligenceEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "TAX_INTELLIGENCE_ENGINE_AUTO_RECOVER",
      DEFAULT_TAX_INTELLIGENCE_ENGINE_CONFIGURATION.autoRecover,
    ),
    defaultJurisdiction: envString(
      "TAX_INTELLIGENCE_ENGINE_DEFAULT_JURISDICTION",
      DEFAULT_TAX_INTELLIGENCE_ENGINE_CONFIGURATION.defaultJurisdiction,
    ),
  };

  return {
    ...DEFAULT_TAX_INTELLIGENCE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
