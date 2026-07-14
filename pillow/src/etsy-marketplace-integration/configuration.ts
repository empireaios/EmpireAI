/** R1-07 — Externalized Etsy Marketplace Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type EtsyMarketplaceIntegrationConfiguration = {
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

export const DEFAULT_ETSY_MARKETPLACE_INTEGRATION_CONFIGURATION: EtsyMarketplaceIntegrationConfiguration =
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
    credentialRef: "vault://etsy-open-api",
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

export function loadEtsyMarketplaceIntegrationConfigFile(
  repositoryRoot: string,
): Partial<EtsyMarketplaceIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "etsy-marketplace-integration.config.json"),
    join(repositoryRoot, "config", "etsy-marketplace-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<EtsyMarketplaceIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildEtsyMarketplaceIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<EtsyMarketplaceIntegrationConfiguration> = {},
): EtsyMarketplaceIntegrationConfiguration {
  const fileConfig = repositoryRoot
    ? loadEtsyMarketplaceIntegrationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<EtsyMarketplaceIntegrationConfiguration> = {
    enabled: envBool(
      "ETSY_MARKETPLACE_INTEGRATION_ENABLED",
      DEFAULT_ETSY_MARKETPLACE_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "ETSY_MARKETPLACE_INTEGRATION_SANDBOX",
      DEFAULT_ETSY_MARKETPLACE_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "ETSY_MARKETPLACE_INTEGRATION_TIMEOUT_MS",
      DEFAULT_ETSY_MARKETPLACE_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "ETSY_MARKETPLACE_INTEGRATION_MAX_RETRIES",
      DEFAULT_ETSY_MARKETPLACE_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "ETSY_MARKETPLACE_INTEGRATION_LOG_LEVEL",
      DEFAULT_ETSY_MARKETPLACE_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as EtsyMarketplaceIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "ETSY_MARKETPLACE_INTEGRATION_AUTO_RECOVER",
      DEFAULT_ETSY_MARKETPLACE_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "ETSY_MARKETPLACE_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_ETSY_MARKETPLACE_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_ETSY_MARKETPLACE_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
