/** R2-11 — Externalized Shipping Carrier Integration configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ShippingCarrierIntegrationConfiguration = {
  enabled: boolean;
  carrierRegistrationRulesEnabled: boolean;
  authenticationRulesEnabled: boolean;
  shipmentRequestRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  rateLimitDelayMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_SHIPPING_CARRIER_INTEGRATION_CONFIGURATION: ShippingCarrierIntegrationConfiguration =
  {
    enabled: true,
    carrierRegistrationRulesEnabled: true,
    authenticationRulesEnabled: true,
    shipmentRequestRulesEnabled: true,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 30000,
    rateLimitDelayMs: 500,
    healthMonitoringRulesEnabled: true,
    loggingLevel: "info",
    autoRecover: true,
    preserveExistingOnValidationFailure: true,
    maskSensitiveValues: true,
  };

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadShippingCarrierIntegrationConfigFile(
  repositoryRoot: string,
): Partial<ShippingCarrierIntegrationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "shipping-carrier-integration.config.json"),
    join(repositoryRoot, "config", "shipping-carrier-integration.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ShippingCarrierIntegrationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildShippingCarrierIntegrationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ShippingCarrierIntegrationConfiguration> = {},
): ShippingCarrierIntegrationConfiguration {
  const fileConfig = repositoryRoot ? loadShippingCarrierIntegrationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ShippingCarrierIntegrationConfiguration> = {
    enabled: envBool(
      "SHIPPING_CARRIER_INTEGRATION_ENABLED",
      DEFAULT_SHIPPING_CARRIER_INTEGRATION_CONFIGURATION.enabled,
    ),
    loggingLevel: envString(
      "SHIPPING_CARRIER_INTEGRATION_LOG_LEVEL",
      DEFAULT_SHIPPING_CARRIER_INTEGRATION_CONFIGURATION.loggingLevel,
    ) as ShippingCarrierIntegrationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SHIPPING_CARRIER_INTEGRATION_AUTO_RECOVER",
      DEFAULT_SHIPPING_CARRIER_INTEGRATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SHIPPING_CARRIER_INTEGRATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
