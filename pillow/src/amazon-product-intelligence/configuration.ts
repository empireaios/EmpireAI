/** R1-03 — Externalized Amazon Product Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AmazonProductIntelligenceConfiguration = {
  enabled: boolean;
  syncFrequencyMinutes: number;
  productMappingRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_AMAZON_PRODUCT_INTELLIGENCE_CONFIGURATION: AmazonProductIntelligenceConfiguration =
  {
    enabled: true,
    syncFrequencyMinutes: 60,
    productMappingRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 30000,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    preserveExistingOnValidationFailure: true,
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

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadAmazonProductIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<AmazonProductIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "amazon-product-intelligence.config.json"),
    join(repositoryRoot, "config", "amazon-product-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AmazonProductIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAmazonProductIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AmazonProductIntelligenceConfiguration> = {},
): AmazonProductIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadAmazonProductIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<AmazonProductIntelligenceConfiguration> = {
    enabled: envBool(
      "AMAZON_PRODUCT_INTELLIGENCE_ENABLED",
      DEFAULT_AMAZON_PRODUCT_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    syncFrequencyMinutes: envInt(
      "AMAZON_PRODUCT_INTELLIGENCE_SYNC_FREQUENCY_MINUTES",
      DEFAULT_AMAZON_PRODUCT_INTELLIGENCE_CONFIGURATION.syncFrequencyMinutes,
    ),
    requestTimeoutMs: envInt(
      "AMAZON_PRODUCT_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_AMAZON_PRODUCT_INTELLIGENCE_CONFIGURATION.requestTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "AMAZON_PRODUCT_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_AMAZON_PRODUCT_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "AMAZON_PRODUCT_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_AMAZON_PRODUCT_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as AmazonProductIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AMAZON_PRODUCT_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_AMAZON_PRODUCT_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_AMAZON_PRODUCT_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
