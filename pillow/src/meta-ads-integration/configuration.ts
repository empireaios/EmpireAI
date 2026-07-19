/** R5-02 — Externalized Meta Ads Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type MetaAdsIntegrationConfiguration = {
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
  defaultBusinessAccountId: string;
  defaultAdAccountId: string;
  maskSensitiveValues: true;
};

export const DEFAULT_META_ADS_INTEGRATION_CONFIGURATION: MetaAdsIntegrationConfiguration = {
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
  credentialRef: "vault://meta-ads-api",
  defaultBusinessAccountId: "biz-meta-default",
  defaultAdAccountId: "act-meta-default",
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

export function loadMetaAdsIntegrationConfigFile(
  repositoryRoot: string,
): Partial<MetaAdsIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "meta-ads-integration.config.json"),
    join(repositoryRoot, "config", "meta-ads-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<MetaAdsIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMetaAdsIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MetaAdsIntegrationConfiguration> = {},
): MetaAdsIntegrationConfiguration {
  const fileConfig = repositoryRoot ? loadMetaAdsIntegrationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<MetaAdsIntegrationConfiguration> = {
    enabled: envBool(
      "META_ADS_INTEGRATION_ENABLED",
      DEFAULT_META_ADS_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "META_ADS_INTEGRATION_SANDBOX",
      DEFAULT_META_ADS_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "META_ADS_INTEGRATION_TIMEOUT_MS",
      DEFAULT_META_ADS_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "META_ADS_INTEGRATION_MAX_RETRIES",
      DEFAULT_META_ADS_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "META_ADS_INTEGRATION_LOG_LEVEL",
      DEFAULT_META_ADS_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as MetaAdsIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "META_ADS_INTEGRATION_AUTO_RECOVER",
      DEFAULT_META_ADS_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "META_ADS_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_META_ADS_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_META_ADS_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
