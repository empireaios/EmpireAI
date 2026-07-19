/** R1-10 — Externalized Shopify Store Marketplace Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ShopifyStoreMarketplaceIntegrationConfiguration = {
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
  webhookRulesEnabled: boolean;
  webhookSignatureVerificationEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  credentialRef: string;
  defaultStoreId: string | null;
  defaultStoreDomain: string | null;
  maskSensitiveValues: true;
};

export const DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION: ShopifyStoreMarketplaceIntegrationConfiguration =
  {
    enabled: true,
    useSandbox: false,
    authenticationRulesEnabled: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    rateLimitEnabled: true,
    requestsPerMinute: 40,
    burstLimit: 5,
    rateLimitWindowMs: 60000,
    webhookRulesEnabled: true,
    webhookSignatureVerificationEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    credentialRef: "vault://shopify-admin-api",
    defaultStoreId: null,
    defaultStoreDomain: null,
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

export function loadShopifyStoreMarketplaceIntegrationConfigFile(
  repositoryRoot: string,
): Partial<ShopifyStoreMarketplaceIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "shopify-store-marketplace-integration.config.json"),
    join(repositoryRoot, "config", "shopify-store-marketplace-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ShopifyStoreMarketplaceIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildShopifyStoreMarketplaceIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ShopifyStoreMarketplaceIntegrationConfiguration> = {},
): ShopifyStoreMarketplaceIntegrationConfiguration {
  const fileConfig = repositoryRoot
    ? loadShopifyStoreMarketplaceIntegrationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ShopifyStoreMarketplaceIntegrationConfiguration> = {
    enabled: envBool(
      "SHOPIFY_STORE_MARKETPLACE_INTEGRATION_ENABLED",
      DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "SHOPIFY_STORE_MARKETPLACE_INTEGRATION_SANDBOX",
      DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "SHOPIFY_STORE_MARKETPLACE_INTEGRATION_TIMEOUT_MS",
      DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SHOPIFY_STORE_MARKETPLACE_INTEGRATION_MAX_RETRIES",
      DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "SHOPIFY_STORE_MARKETPLACE_INTEGRATION_LOG_LEVEL",
      DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as ShopifyStoreMarketplaceIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SHOPIFY_STORE_MARKETPLACE_INTEGRATION_AUTO_RECOVER",
      DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION.credentialRef,
    ),
    defaultStoreId:
      process.env.SHOPIFY_STORE_MARKETPLACE_INTEGRATION_DEFAULT_STORE_ID ??
      DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION.defaultStoreId,
    defaultStoreDomain:
      process.env.SHOPIFY_STORE_MARKETPLACE_INTEGRATION_DEFAULT_STORE_DOMAIN ??
      DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION.defaultStoreDomain,
  };

  return {
    ...DEFAULT_SHOPIFY_STORE_MARKETPLACE_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
