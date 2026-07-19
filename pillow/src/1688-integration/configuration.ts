/** R2-04 — Externalized 1688 Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type Oss1688IntegrationConfiguration = {
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
  webhookRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  credentialRef: string;
  maskSensitiveValues: true;
};

export const DEFAULT_OSS1688_INTEGRATION_CONFIGURATION: Oss1688IntegrationConfiguration =
  {
    enabled: true,
    useSandbox: true,
    apiEndpointRulesEnabled: true,
    authenticationRulesEnabled: true,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    rateLimitEnabled: true,
    requestsPerMinute: 60,
    burstLimit: 10,
    rateLimitWindowMs: 60000,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    webhookRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    credentialRef: "vault://1688-api",
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

export function loadOss1688IntegrationConfigFile(
  repositoryRoot: string,
): Partial<Oss1688IntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "1688-integration.config.json"),
    join(repositoryRoot, "config", "1688-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<Oss1688IntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildOss1688IntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<Oss1688IntegrationConfiguration> = {},
): Oss1688IntegrationConfiguration {
  const fileConfig = repositoryRoot
    ? loadOss1688IntegrationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<Oss1688IntegrationConfiguration> = {
    enabled: envBool(
      "OSS1688_INTEGRATION_ENABLED",
      DEFAULT_OSS1688_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "OSS1688_INTEGRATION_SANDBOX",
      DEFAULT_OSS1688_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "OSS1688_INTEGRATION_TIMEOUT_MS",
      DEFAULT_OSS1688_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "OSS1688_INTEGRATION_MAX_RETRIES",
      DEFAULT_OSS1688_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "OSS1688_INTEGRATION_LOG_LEVEL",
      DEFAULT_OSS1688_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as Oss1688IntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "OSS1688_INTEGRATION_AUTO_RECOVER",
      DEFAULT_OSS1688_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "OSS1688_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_OSS1688_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_OSS1688_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
