/** R2-02 — Externalized CJdropshipping Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CjDropshippingIntegrationConfiguration = {
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

export const DEFAULT_CJDROPSHIPPING_INTEGRATION_CONFIGURATION: CjDropshippingIntegrationConfiguration =
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
    credentialRef: "vault://cj-dropshipping-api",
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

export function loadCjDropshippingIntegrationConfigFile(
  repositoryRoot: string,
): Partial<CjDropshippingIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "cj-dropshipping-integration.config.json"),
    join(repositoryRoot, "config", "cj-dropshipping-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CjDropshippingIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCjDropshippingIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CjDropshippingIntegrationConfiguration> = {},
): CjDropshippingIntegrationConfiguration {
  const fileConfig = repositoryRoot
    ? loadCjDropshippingIntegrationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CjDropshippingIntegrationConfiguration> = {
    enabled: envBool(
      "CJDROPSHIPPING_INTEGRATION_ENABLED",
      DEFAULT_CJDROPSHIPPING_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "CJDROPSHIPPING_INTEGRATION_SANDBOX",
      DEFAULT_CJDROPSHIPPING_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "CJDROPSHIPPING_INTEGRATION_TIMEOUT_MS",
      DEFAULT_CJDROPSHIPPING_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CJDROPSHIPPING_INTEGRATION_MAX_RETRIES",
      DEFAULT_CJDROPSHIPPING_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "CJDROPSHIPPING_INTEGRATION_LOG_LEVEL",
      DEFAULT_CJDROPSHIPPING_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as CjDropshippingIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CJDROPSHIPPING_INTEGRATION_AUTO_RECOVER",
      DEFAULT_CJDROPSHIPPING_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "CJDROPSHIPPING_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_CJDROPSHIPPING_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_CJDROPSHIPPING_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
