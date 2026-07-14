/** R1-08 — Externalized eBay Marketplace Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type EbayMarketplaceIntegrationConfiguration = {
  enabled: boolean;
  useSandbox: boolean;
  authenticationRulesEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  rateLimitEnabled: boolean;
  requestsPerMinute: number;
  burstLimit: number;
  rateLimitWindowMs: number;
  eventHandlingRulesEnabled: boolean;
  eventSignatureVerificationEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  credentialRef: string;
  maskSensitiveValues: true;
};

export const DEFAULT_EBAY_MARKETPLACE_INTEGRATION_CONFIGURATION: EbayMarketplaceIntegrationConfiguration =
  {
    enabled: true,
    useSandbox: false,
    authenticationRulesEnabled: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    rateLimitEnabled: true,
    requestsPerMinute: 30,
    burstLimit: 5,
    rateLimitWindowMs: 60000,
    eventHandlingRulesEnabled: true,
    eventSignatureVerificationEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    credentialRef: "vault://ebay-developer-api",
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

export function loadEbayMarketplaceIntegrationConfigFile(
  repositoryRoot: string,
): Partial<EbayMarketplaceIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "ebay-marketplace-integration.config.json"),
    join(repositoryRoot, "config", "ebay-marketplace-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<EbayMarketplaceIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildEbayMarketplaceIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EbayMarketplaceIntegrationConfiguration> = {},
): EbayMarketplaceIntegrationConfiguration {
  const fileConfig = repositoryRoot
    ? loadEbayMarketplaceIntegrationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<EbayMarketplaceIntegrationConfiguration> = {
    enabled: envBool(
      "EBAY_MARKETPLACE_INTEGRATION_ENABLED",
      DEFAULT_EBAY_MARKETPLACE_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "EBAY_MARKETPLACE_INTEGRATION_SANDBOX",
      DEFAULT_EBAY_MARKETPLACE_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "EBAY_MARKETPLACE_INTEGRATION_TIMEOUT_MS",
      DEFAULT_EBAY_MARKETPLACE_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "EBAY_MARKETPLACE_INTEGRATION_MAX_RETRIES",
      DEFAULT_EBAY_MARKETPLACE_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "EBAY_MARKETPLACE_INTEGRATION_LOG_LEVEL",
      DEFAULT_EBAY_MARKETPLACE_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as EbayMarketplaceIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EBAY_MARKETPLACE_INTEGRATION_AUTO_RECOVER",
      DEFAULT_EBAY_MARKETPLACE_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "EBAY_MARKETPLACE_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_EBAY_MARKETPLACE_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_EBAY_MARKETPLACE_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
