/** R1-09 — Externalized TikTok Shop Marketplace Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type TikTokShopMarketplaceIntegrationConfiguration = {
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
  defaultShopId: string | null;
  maskSensitiveValues: true;
};

export const DEFAULT_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CONFIGURATION: TikTokShopMarketplaceIntegrationConfiguration =
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
    credentialRef: "vault://tiktok-shop-open-api",
    defaultShopId: null,
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

export function loadTikTokShopMarketplaceIntegrationConfigFile(
  repositoryRoot: string,
): Partial<TikTokShopMarketplaceIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "tiktok-shop-marketplace-integration.config.json"),
    join(repositoryRoot, "config", "tiktok-shop-marketplace-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<TikTokShopMarketplaceIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildTikTokShopMarketplaceIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<TikTokShopMarketplaceIntegrationConfiguration> = {},
): TikTokShopMarketplaceIntegrationConfiguration {
  const fileConfig = repositoryRoot
    ? loadTikTokShopMarketplaceIntegrationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<TikTokShopMarketplaceIntegrationConfiguration> = {
    enabled: envBool(
      "TIKTOK_SHOP_MARKETPLACE_INTEGRATION_ENABLED",
      DEFAULT_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "TIKTOK_SHOP_MARKETPLACE_INTEGRATION_SANDBOX",
      DEFAULT_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "TIKTOK_SHOP_MARKETPLACE_INTEGRATION_TIMEOUT_MS",
      DEFAULT_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "TIKTOK_SHOP_MARKETPLACE_INTEGRATION_MAX_RETRIES",
      DEFAULT_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "TIKTOK_SHOP_MARKETPLACE_INTEGRATION_LOG_LEVEL",
      DEFAULT_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as TikTokShopMarketplaceIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "TIKTOK_SHOP_MARKETPLACE_INTEGRATION_AUTO_RECOVER",
      DEFAULT_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CONFIGURATION.credentialRef,
    ),
    defaultShopId:
      process.env.TIKTOK_SHOP_MARKETPLACE_INTEGRATION_DEFAULT_SHOP_ID ??
      DEFAULT_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CONFIGURATION.defaultShopId,
  };

  return {
    ...DEFAULT_TIKTOK_SHOP_MARKETPLACE_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
