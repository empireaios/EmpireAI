/** R5-04 — Externalized TikTok Ads Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type TikTokAdsIntegrationConfiguration = {
  enabled: boolean;
  useSandbox: boolean;
  authenticationRulesEnabled: boolean;
  campaignSynchronizationRulesEnabled: boolean;
  audienceSynchronizationRulesEnabled: boolean;
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
  defaultAdvertiserAccountId: string;
  maskSensitiveValues: true;
};

export const DEFAULT_TIKTOK_ADS_INTEGRATION_CONFIGURATION: TikTokAdsIntegrationConfiguration = {
  enabled: true,
  useSandbox: true,
  authenticationRulesEnabled: true,
  campaignSynchronizationRulesEnabled: true,
  audienceSynchronizationRulesEnabled: true,
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
  credentialRef: "vault://tiktok-ads-api",
  defaultAdvertiserAccountId: "adv-tiktok-default",
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

export function loadTikTokAdsIntegrationConfigFile(
  repositoryRoot: string,
): Partial<TikTokAdsIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "tiktok-ads-integration.config.json"),
    join(repositoryRoot, "config", "tiktok-ads-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<TikTokAdsIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildTikTokAdsIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<TikTokAdsIntegrationConfiguration> = {},
): TikTokAdsIntegrationConfiguration {
  const fileConfig = repositoryRoot ? loadTikTokAdsIntegrationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<TikTokAdsIntegrationConfiguration> = {
    enabled: envBool(
      "TIKTOK_ADS_INTEGRATION_ENABLED",
      DEFAULT_TIKTOK_ADS_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "TIKTOK_ADS_INTEGRATION_SANDBOX",
      DEFAULT_TIKTOK_ADS_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "TIKTOK_ADS_INTEGRATION_TIMEOUT_MS",
      DEFAULT_TIKTOK_ADS_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "TIKTOK_ADS_INTEGRATION_MAX_RETRIES",
      DEFAULT_TIKTOK_ADS_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "TIKTOK_ADS_INTEGRATION_LOG_LEVEL",
      DEFAULT_TIKTOK_ADS_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as TikTokAdsIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "TIKTOK_ADS_INTEGRATION_AUTO_RECOVER",
      DEFAULT_TIKTOK_ADS_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "TIKTOK_ADS_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_TIKTOK_ADS_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_TIKTOK_ADS_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
