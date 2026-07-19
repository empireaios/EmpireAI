/** R3-03 — Externalized Banking Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type BankingIntegrationConfiguration = {
  enabled: boolean;
  useSandbox: boolean;
  bankingProviderRulesEnabled: boolean;
  authenticationRulesEnabled: boolean;
  synchronizationRulesEnabled: boolean;
  notificationRulesEnabled: boolean;
  synchronizationFrequencyMinutes: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  rateLimitEnabled: boolean;
  operationsPerMinute: number;
  burstLimit: number;
  rateLimitWindowMs: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  credentialRef: string;
  defaultCurrency: string;
  maskSensitiveValues: true;
};

export const DEFAULT_BANKING_INTEGRATION_CONFIGURATION: BankingIntegrationConfiguration = {
  enabled: true,
  useSandbox: true,
  bankingProviderRulesEnabled: true,
  authenticationRulesEnabled: true,
  synchronizationRulesEnabled: true,
  notificationRulesEnabled: true,
  synchronizationFrequencyMinutes: 60,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  rateLimitEnabled: true,
  operationsPerMinute: 60,
  burstLimit: 10,
  rateLimitWindowMs: 60000,
  validationRulesEnabled: true,
  healthMonitoringRulesEnabled: true,
  loggingLevel: "info",
  autoRecover: true,
  credentialRef: "vault://banking-integration-api",
  defaultCurrency: "USD",
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

export function loadBankingIntegrationConfigFile(
  repositoryRoot: string,
): Partial<BankingIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "banking-integration.config.json"),
    join(repositoryRoot, "config", "banking-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<BankingIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildBankingIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BankingIntegrationConfiguration> = {},
): BankingIntegrationConfiguration {
  const fileConfig = repositoryRoot ? loadBankingIntegrationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<BankingIntegrationConfiguration> = {
    enabled: envBool(
      "BANKING_INTEGRATION_ENABLED",
      DEFAULT_BANKING_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "BANKING_INTEGRATION_SANDBOX",
      DEFAULT_BANKING_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "BANKING_INTEGRATION_TIMEOUT_MS",
      DEFAULT_BANKING_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "BANKING_INTEGRATION_MAX_RETRIES",
      DEFAULT_BANKING_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "BANKING_INTEGRATION_LOG_LEVEL",
      DEFAULT_BANKING_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as BankingIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "BANKING_INTEGRATION_AUTO_RECOVER",
      DEFAULT_BANKING_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "BANKING_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_BANKING_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_BANKING_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
