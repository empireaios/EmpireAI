/** R1-06 — Externalized Walmart Marketplace Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type WalmartMarketplaceIntegrationConfiguration = {
  enabled: boolean;
  useSandbox: boolean;
  apiEndpointRulesEnabled: boolean;
  authenticationRulesEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  rateLimitEnabled: boolean;
  requestsPerMinute: number;
  burstLimit: number;
  rateLimitWindowMs: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  credentialRef: string;
  maskSensitiveValues: true;
};

export const DEFAULT_WALMART_MARKETPLACE_INTEGRATION_CONFIGURATION: WalmartMarketplaceIntegrationConfiguration =
  {
    enabled: true,
    useSandbox: false,
    apiEndpointRulesEnabled: true,
    authenticationRulesEnabled: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    rateLimitEnabled: true,
    requestsPerMinute: 30,
    burstLimit: 5,
    rateLimitWindowMs: 60000,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    credentialRef: "vault://walmart-marketplace-api",
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

export function loadWalmartMarketplaceIntegrationConfigFile(
  repositoryRoot: string,
): Partial<WalmartMarketplaceIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "walmart-marketplace-integration.config.json"),
    join(repositoryRoot, "config", "walmart-marketplace-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<WalmartMarketplaceIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildWalmartMarketplaceIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WalmartMarketplaceIntegrationConfiguration> = {},
): WalmartMarketplaceIntegrationConfiguration {
  const fileConfig = repositoryRoot
    ? loadWalmartMarketplaceIntegrationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<WalmartMarketplaceIntegrationConfiguration> = {
    enabled: envBool(
      "WALMART_MARKETPLACE_INTEGRATION_ENABLED",
      DEFAULT_WALMART_MARKETPLACE_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "WALMART_MARKETPLACE_INTEGRATION_SANDBOX",
      DEFAULT_WALMART_MARKETPLACE_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "WALMART_MARKETPLACE_INTEGRATION_TIMEOUT_MS",
      DEFAULT_WALMART_MARKETPLACE_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "WALMART_MARKETPLACE_INTEGRATION_MAX_RETRIES",
      DEFAULT_WALMART_MARKETPLACE_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "WALMART_MARKETPLACE_INTEGRATION_LOG_LEVEL",
      DEFAULT_WALMART_MARKETPLACE_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as WalmartMarketplaceIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "WALMART_MARKETPLACE_INTEGRATION_AUTO_RECOVER",
      DEFAULT_WALMART_MARKETPLACE_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "WALMART_MARKETPLACE_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_WALMART_MARKETPLACE_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_WALMART_MARKETPLACE_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
