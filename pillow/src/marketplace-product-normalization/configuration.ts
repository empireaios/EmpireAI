/** R1-12 — Externalized Marketplace Product Normalization configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type MarketplaceProductNormalizationConfiguration = {
  enabled: boolean;
  productSchemaRulesEnabled: boolean;
  marketplaceMappingRulesEnabled: boolean;
  duplicateDetectionRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveSourceIdentifiers: boolean;
  preserveExistingOnValidationFailure: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_MARKETPLACE_PRODUCT_NORMALIZATION_CONFIGURATION: MarketplaceProductNormalizationConfiguration =
  {
    enabled: true,
    productSchemaRulesEnabled: true,
    marketplaceMappingRulesEnabled: true,
    duplicateDetectionRulesEnabled: true,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 30000,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    preserveSourceIdentifiers: true,
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

export function loadMarketplaceProductNormalizationConfigFile(
  repositoryRoot: string,
): Partial<MarketplaceProductNormalizationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "marketplace-product-normalization.config.json"),
    join(repositoryRoot, "config", "marketplace-product-normalization.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<MarketplaceProductNormalizationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMarketplaceProductNormalizationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MarketplaceProductNormalizationConfiguration> = {},
): MarketplaceProductNormalizationConfiguration {
  const fileConfig = repositoryRoot
    ? loadMarketplaceProductNormalizationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<MarketplaceProductNormalizationConfiguration> = {
    enabled: envBool(
      "MARKETPLACE_PRODUCT_NORMALIZATION_ENABLED",
      DEFAULT_MARKETPLACE_PRODUCT_NORMALIZATION_CONFIGURATION.enabled,
    ),
    requestTimeoutMs: envInt(
      "MARKETPLACE_PRODUCT_NORMALIZATION_TIMEOUT_MS",
      DEFAULT_MARKETPLACE_PRODUCT_NORMALIZATION_CONFIGURATION.requestTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "MARKETPLACE_PRODUCT_NORMALIZATION_MAX_RETRIES",
      DEFAULT_MARKETPLACE_PRODUCT_NORMALIZATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "MARKETPLACE_PRODUCT_NORMALIZATION_LOG_LEVEL",
      DEFAULT_MARKETPLACE_PRODUCT_NORMALIZATION_CONFIGURATION.loggingLevel,
    ) as MarketplaceProductNormalizationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MARKETPLACE_PRODUCT_NORMALIZATION_AUTO_RECOVER",
      DEFAULT_MARKETPLACE_PRODUCT_NORMALIZATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_MARKETPLACE_PRODUCT_NORMALIZATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
