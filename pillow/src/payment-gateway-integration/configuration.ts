/** R3-02 — Externalized Payment Gateway Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type PaymentGatewayIntegrationConfiguration = {
  enabled: boolean;
  useSandbox: boolean;
  gatewayRegistrationRulesEnabled: boolean;
  authenticationRulesEnabled: boolean;
  paymentProcessingRulesEnabled: boolean;
  webhookRulesEnabled: boolean;
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

export const DEFAULT_PAYMENT_GATEWAY_INTEGRATION_CONFIGURATION: PaymentGatewayIntegrationConfiguration =
  {
    enabled: true,
    useSandbox: true,
    gatewayRegistrationRulesEnabled: true,
    authenticationRulesEnabled: true,
    paymentProcessingRulesEnabled: true,
    webhookRulesEnabled: true,
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
    credentialRef: "vault://payment-gateway-api",
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

export function loadPaymentGatewayIntegrationConfigFile(
  repositoryRoot: string,
): Partial<PaymentGatewayIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "payment-gateway-integration.config.json"),
    join(repositoryRoot, "config", "payment-gateway-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<PaymentGatewayIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPaymentGatewayIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PaymentGatewayIntegrationConfiguration> = {},
): PaymentGatewayIntegrationConfiguration {
  const fileConfig = repositoryRoot
    ? loadPaymentGatewayIntegrationConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<PaymentGatewayIntegrationConfiguration> = {
    enabled: envBool(
      "PAYMENT_GATEWAY_INTEGRATION_ENABLED",
      DEFAULT_PAYMENT_GATEWAY_INTEGRATION_CONFIGURATION.enabled,
    ),
    useSandbox: envBool(
      "PAYMENT_GATEWAY_INTEGRATION_SANDBOX",
      DEFAULT_PAYMENT_GATEWAY_INTEGRATION_CONFIGURATION.useSandbox,
    ),
    connectionTimeoutMs: envInt(
      "PAYMENT_GATEWAY_INTEGRATION_TIMEOUT_MS",
      DEFAULT_PAYMENT_GATEWAY_INTEGRATION_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PAYMENT_GATEWAY_INTEGRATION_MAX_RETRIES",
      DEFAULT_PAYMENT_GATEWAY_INTEGRATION_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "PAYMENT_GATEWAY_INTEGRATION_LOG_LEVEL",
      DEFAULT_PAYMENT_GATEWAY_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as PaymentGatewayIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PAYMENT_GATEWAY_INTEGRATION_AUTO_RECOVER",
      DEFAULT_PAYMENT_GATEWAY_INTEGRATION_CONFIGURATION.autoRecover,
    ),
    credentialRef: envString(
      "PAYMENT_GATEWAY_INTEGRATION_CREDENTIAL_REF",
      DEFAULT_PAYMENT_GATEWAY_INTEGRATION_CONFIGURATION.credentialRef,
    ),
  };

  return {
    ...DEFAULT_PAYMENT_GATEWAY_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
