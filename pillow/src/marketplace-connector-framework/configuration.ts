/** R1-01 — Externalized Marketplace Connector Framework configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type MarketplaceConnectorFrameworkConfiguration = {
  enabled: boolean;
  connectorRegistrationRulesEnabled: boolean;
  authenticationRulesEnabled: boolean;
  apiTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  rateLimitEnabled: boolean;
  defaultRequestsPerMinute: number;
  defaultBurstLimit: number;
  rateLimitWindowMs: number;
  webhookRulesEnabled: boolean;
  webhookSignatureVerificationEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  maxRegisteredConnectors: number;
  isolateConnectors: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_MARKETPLACE_CONNECTOR_FRAMEWORK_CONFIGURATION: MarketplaceConnectorFrameworkConfiguration =
  {
    enabled: true,
    connectorRegistrationRulesEnabled: true,
    authenticationRulesEnabled: true,
    apiTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    retryBackoffMultiplier: 2,
    rateLimitEnabled: true,
    defaultRequestsPerMinute: 60,
    defaultBurstLimit: 10,
    rateLimitWindowMs: 60000,
    webhookRulesEnabled: true,
    webhookSignatureVerificationEnabled: true,
    healthMonitoringRulesEnabled: true,
    validationRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    maxRegisteredConnectors: 50,
    isolateConnectors: true,
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

export function loadMarketplaceConnectorFrameworkConfigFile(
  repositoryRoot: string,
): Partial<MarketplaceConnectorFrameworkConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "marketplace-connector-framework.config.json"),
    join(repositoryRoot, "config", "marketplace-connector-framework.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<MarketplaceConnectorFrameworkConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMarketplaceConnectorFrameworkConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MarketplaceConnectorFrameworkConfiguration> = {},
): MarketplaceConnectorFrameworkConfiguration {
  const fileConfig = repositoryRoot
    ? loadMarketplaceConnectorFrameworkConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<MarketplaceConnectorFrameworkConfiguration> = {
    enabled: envBool(
      "MARKETPLACE_CONNECTOR_FRAMEWORK_ENABLED",
      DEFAULT_MARKETPLACE_CONNECTOR_FRAMEWORK_CONFIGURATION.enabled,
    ),
    apiTimeoutMs: envInt(
      "MARKETPLACE_CONNECTOR_FRAMEWORK_API_TIMEOUT_MS",
      DEFAULT_MARKETPLACE_CONNECTOR_FRAMEWORK_CONFIGURATION.apiTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "MARKETPLACE_CONNECTOR_FRAMEWORK_MAX_RETRIES",
      DEFAULT_MARKETPLACE_CONNECTOR_FRAMEWORK_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "MARKETPLACE_CONNECTOR_FRAMEWORK_LOG_LEVEL",
      DEFAULT_MARKETPLACE_CONNECTOR_FRAMEWORK_CONFIGURATION.loggingLevel,
    ) as MarketplaceConnectorFrameworkConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MARKETPLACE_CONNECTOR_FRAMEWORK_AUTO_RECOVER",
      DEFAULT_MARKETPLACE_CONNECTOR_FRAMEWORK_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_MARKETPLACE_CONNECTOR_FRAMEWORK_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
