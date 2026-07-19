/** R1-11 — Externalized WooCommerce Marketplace Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type WooCommerceMarketplaceIntegrationConfiguration = {
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
  defaultStoreUrl: string | null;
  maskSensitiveValues: true;
};

export const DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION: WooCommerceMarketplaceIntegrationConfiguration =
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
    credentialRef: "vault://woocommerce-rest-api",
    defaultStoreId: null,
    defaultStoreUrl: null,
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

export function loadWooCommerceMarketplaceIntegrationConfigFile(
  repositoryRoot: string,
): Partial<WooCommerceMarketplaceIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "woocommerce-marketplace-integration.config.json"),
    join(repositoryRoot, "config", "woocommerce-marketplace-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<WooCommerceMarketplaceIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildWooCommerceMarketplaceIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WooCommerceMarketplaceIntegrationConfiguration> = {},
): WooCommerceMarketplaceIntegrationConfiguration {
  const fileConfig = repositoryRoot
    ? loadWooCommerceMarketplaceIntegrationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<WooCommerceMarketplaceIntegrationConfiguration> = {
    enabled: envBool(
      "WOOCOMMERCE_MARKETPLACE_INTEGRATION_ENABLED",
      DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "WOOCOMMERCE_MARKETPLACE_INTEGRATION_SANDBOX",
      DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "WOOCOMMERCE_MARKETPLACE_INTEGRATION_TIMEOUT_MS",
      DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "WOOCOMMERCE_MARKETPLACE_INTEGRATION_MAX_RETRIES",
      DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "WOOCOMMERCE_MARKETPLACE_INTEGRATION_LOG_LEVEL",
      DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as WooCommerceMarketplaceIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "WOOCOMMERCE_MARKETPLACE_INTEGRATION_AUTO_RECOVER",
      DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "WOOCOMMERCE_MARKETPLACE_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION.credentialRef,
    ),
    defaultStoreId:
      process.env.WOOCOMMERCE_MARKETPLACE_INTEGRATION_DEFAULT_STORE_ID ??
      DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION.defaultStoreId,
    defaultStoreUrl:
      process.env.WOOCOMMERCE_MARKETPLACE_INTEGRATION_DEFAULT_STORE_URL ??
      DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION.defaultStoreUrl,
  };

  return {
    ...DEFAULT_WOOCOMMERCE_MARKETPLACE_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
