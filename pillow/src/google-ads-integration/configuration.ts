/** R5-03 — Externalized Google Ads Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type GoogleAdsIntegrationConfiguration = {
  enabled: boolean;
  useSandbox: boolean;
  authenticationRulesEnabled: boolean;
  campaignSynchronizationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  rateLimitEnabled: boolean;
  operationsPerMinute: number;
  burstLimit: number;
  rateLimitWindowMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  credentialRef: string;
  defaultCustomerAccountId: string;
  defaultAdvertisingAccountId: string;
  maskSensitiveValues: true;
};

export const DEFAULT_GOOGLE_ADS_INTEGRATION_CONFIGURATION: GoogleAdsIntegrationConfiguration = {
  enabled: true,
  useSandbox: true,
  authenticationRulesEnabled: true,
  campaignSynchronizationRulesEnabled: true,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  rateLimitEnabled: true,
  operationsPerMinute: 60,
  burstLimit: 10,
  rateLimitWindowMs: 60000,
  loggingLevel: "info",
  autoRecover: true,
  credentialRef: "vault://google-ads-api",
  defaultCustomerAccountId: "cust-google-default",
  defaultAdvertisingAccountId: "act-google-default",
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

export function loadGoogleAdsIntegrationConfigFile(
  repositoryRoot: string,
): Partial<GoogleAdsIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "google-ads-integration.config.json"),
    join(repositoryRoot, "config", "google-ads-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<GoogleAdsIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildGoogleAdsIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<GoogleAdsIntegrationConfiguration> = {},
): GoogleAdsIntegrationConfiguration {
  const fileConfig = repositoryRoot ? loadGoogleAdsIntegrationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<GoogleAdsIntegrationConfiguration> = {
    enabled: envBool(
      "GOOGLE_ADS_INTEGRATION_ENABLED",
      DEFAULT_GOOGLE_ADS_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "GOOGLE_ADS_INTEGRATION_SANDBOX",
      DEFAULT_GOOGLE_ADS_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "GOOGLE_ADS_INTEGRATION_TIMEOUT_MS",
      DEFAULT_GOOGLE_ADS_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "GOOGLE_ADS_INTEGRATION_MAX_RETRIES",
      DEFAULT_GOOGLE_ADS_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "GOOGLE_ADS_INTEGRATION_LOG_LEVEL",
      DEFAULT_GOOGLE_ADS_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as GoogleAdsIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "GOOGLE_ADS_INTEGRATION_AUTO_RECOVER",
      DEFAULT_GOOGLE_ADS_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "GOOGLE_ADS_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_GOOGLE_ADS_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_GOOGLE_ADS_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
