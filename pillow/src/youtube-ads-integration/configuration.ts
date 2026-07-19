/** R5-05 — Externalized YouTube Ads Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type YouTubeAdsIntegrationConfiguration = {
  enabled: boolean;
  useSandbox: boolean;
  authenticationRulesEnabled: boolean;
  campaignSynchronizationRulesEnabled: boolean;
  videoAssetRulesEnabled: boolean;
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

export const DEFAULT_YOUTUBE_ADS_INTEGRATION_CONFIGURATION: YouTubeAdsIntegrationConfiguration = {
  enabled: true,
  useSandbox: true,
  authenticationRulesEnabled: true,
  campaignSynchronizationRulesEnabled: true,
  videoAssetRulesEnabled: true,
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
  credentialRef: "vault://youtube-ads-api",
  defaultAdvertiserAccountId: "adv-youtube-default",
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

export function loadYouTubeAdsIntegrationConfigFile(
  repositoryRoot: string,
): Partial<YouTubeAdsIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "youtube-ads-integration.config.json"),
    join(repositoryRoot, "config", "youtube-ads-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<YouTubeAdsIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildYouTubeAdsIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<YouTubeAdsIntegrationConfiguration> = {},
): YouTubeAdsIntegrationConfiguration {
  const fileConfig = repositoryRoot ? loadYouTubeAdsIntegrationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<YouTubeAdsIntegrationConfiguration> = {
    enabled: envBool(
      "YOUTUBE_ADS_INTEGRATION_ENABLED",
      DEFAULT_YOUTUBE_ADS_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "YOUTUBE_ADS_INTEGRATION_SANDBOX",
      DEFAULT_YOUTUBE_ADS_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "YOUTUBE_ADS_INTEGRATION_TIMEOUT_MS",
      DEFAULT_YOUTUBE_ADS_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "YOUTUBE_ADS_INTEGRATION_MAX_RETRIES",
      DEFAULT_YOUTUBE_ADS_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "YOUTUBE_ADS_INTEGRATION_LOG_LEVEL",
      DEFAULT_YOUTUBE_ADS_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as YouTubeAdsIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "YOUTUBE_ADS_INTEGRATION_AUTO_RECOVER",
      DEFAULT_YOUTUBE_ADS_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "YOUTUBE_ADS_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_YOUTUBE_ADS_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_YOUTUBE_ADS_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
