/** R2-03 — Externalized AliExpress Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AliExpressIntegrationConfiguration = {
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

export const DEFAULT_ALIEXPRESS_INTEGRATION_CONFIGURATION: AliExpressIntegrationConfiguration =
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
    credentialRef: "vault://aliexpress-api",
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

export function loadAliExpressIntegrationConfigFile(
  repositoryRoot: string,
): Partial<AliExpressIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "aliexpress-integration.config.json"),
    join(repositoryRoot, "config", "aliexpress-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AliExpressIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAliExpressIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AliExpressIntegrationConfiguration> = {},
): AliExpressIntegrationConfiguration {
  const fileConfig = repositoryRoot
    ? loadAliExpressIntegrationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<AliExpressIntegrationConfiguration> = {
    enabled: envBool(
      "ALIEXPRESS_INTEGRATION_ENABLED",
      DEFAULT_ALIEXPRESS_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "ALIEXPRESS_INTEGRATION_SANDBOX",
      DEFAULT_ALIEXPRESS_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "ALIEXPRESS_INTEGRATION_TIMEOUT_MS",
      DEFAULT_ALIEXPRESS_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "ALIEXPRESS_INTEGRATION_MAX_RETRIES",
      DEFAULT_ALIEXPRESS_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "ALIEXPRESS_INTEGRATION_LOG_LEVEL",
      DEFAULT_ALIEXPRESS_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as AliExpressIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "ALIEXPRESS_INTEGRATION_AUTO_RECOVER",
      DEFAULT_ALIEXPRESS_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "ALIEXPRESS_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_ALIEXPRESS_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_ALIEXPRESS_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
