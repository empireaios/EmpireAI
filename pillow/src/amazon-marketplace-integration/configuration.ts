/** R1-02 — Externalized Amazon Marketplace Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AmazonMarketplaceIntegrationConfiguration = {
  enabled: boolean;
  defaultRegion: "na" | "fe" | "eu";
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

export const DEFAULT_AMAZON_MARKETPLACE_INTEGRATION_CONFIGURATION: AmazonMarketplaceIntegrationConfiguration =
  {
    enabled: true,
    defaultRegion: "na",
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
    credentialRef: "vault://amazon-sp-api",
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

export function loadAmazonMarketplaceIntegrationConfigFile(
  repositoryRoot: string,
): Partial<AmazonMarketplaceIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "amazon-marketplace-integration.config.json"),
    join(repositoryRoot, "config", "amazon-marketplace-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AmazonMarketplaceIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAmazonMarketplaceIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AmazonMarketplaceIntegrationConfiguration> = {},
): AmazonMarketplaceIntegrationConfiguration {
  const fileConfig = repositoryRoot
    ? loadAmazonMarketplaceIntegrationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<AmazonMarketplaceIntegrationConfiguration> = {
    enabled: envBool(
      "AMAZON_MARKETPLACE_INTEGRATION_ENABLED",
      DEFAULT_AMAZON_MARKETPLACE_INTEGRATION_CONFIGURATION.enabled,
    ),
    defaultRegion: envString(
      "AMAZON_MARKETPLACE_INTEGRATION_REGION",
      DEFAULT_AMAZON_MARKETPLACE_INTEGRATION_CONFIGURATION.defaultRegion,
    ) as AmazonMarketplaceIntegrationConfiguration["defaultRegion"],
    useSandbox: envBool(
      "AMAZON_MARKETPLACE_INTEGRATION_SANDBOX",
      DEFAULT_AMAZON_MARKETPLACE_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "AMAZON_MARKETPLACE_INTEGRATION_TIMEOUT_MS",
      DEFAULT_AMAZON_MARKETPLACE_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "AMAZON_MARKETPLACE_INTEGRATION_MAX_RETRIES",
      DEFAULT_AMAZON_MARKETPLACE_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "AMAZON_MARKETPLACE_INTEGRATION_LOG_LEVEL",
      DEFAULT_AMAZON_MARKETPLACE_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as AmazonMarketplaceIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AMAZON_MARKETPLACE_INTEGRATION_AUTO_RECOVER",
      DEFAULT_AMAZON_MARKETPLACE_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "AMAZON_MARKETPLACE_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_AMAZON_MARKETPLACE_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_AMAZON_MARKETPLACE_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
