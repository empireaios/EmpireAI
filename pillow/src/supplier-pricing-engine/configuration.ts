/** R2-07 — Externalized Supplier Pricing Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SupplierPricingEngineConfiguration = {
  enabled: boolean;
  synchronizationFrequencyMs: number;
  currencyHandlingRulesEnabled: boolean;
  priceValidationRulesEnabled: boolean;
  priceAnomalyThresholdPercent: number;
  landedCostRulesEnabled: boolean;
  landedCostShippingPercent: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_SUPPLIER_PRICING_ENGINE_CONFIGURATION: SupplierPricingEngineConfiguration =
  {
    enabled: true,
    synchronizationFrequencyMs: 300000,
    currencyHandlingRulesEnabled: true,
    priceValidationRulesEnabled: true,
    priceAnomalyThresholdPercent: 50,
    landedCostRulesEnabled: true,
    landedCostShippingPercent: 15,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    requestTimeoutMs: 30000,
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

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadSupplierPricingEngineConfigFile(
  repositoryRoot: string,
): Partial<SupplierPricingEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "supplier-pricing-engine.config.json"),
    join(repositoryRoot, "config", "supplier-pricing-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<SupplierPricingEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSupplierPricingEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SupplierPricingEngineConfiguration> = {},
): SupplierPricingEngineConfiguration {
  const fileConfig = repositoryRoot ? loadSupplierPricingEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<SupplierPricingEngineConfiguration> = {
    enabled: envBool(
      "SUPPLIER_PRICING_ENGINE_ENABLED",
      DEFAULT_SUPPLIER_PRICING_ENGINE_CONFIGURATION.enabled,
    ),
    synchronizationFrequencyMs: envInt(
      "SUPPLIER_PRICING_ENGINE_FREQUENCY_MS",
      DEFAULT_SUPPLIER_PRICING_ENGINE_CONFIGURATION.synchronizationFrequencyMs,
    ),
    priceAnomalyThresholdPercent: envInt(
      "SUPPLIER_PRICING_ENGINE_ANOMALY_THRESHOLD",
      DEFAULT_SUPPLIER_PRICING_ENGINE_CONFIGURATION.priceAnomalyThresholdPercent,
    ),
    loggingLevel: envString(
      "SUPPLIER_PRICING_ENGINE_LOG_LEVEL",
      DEFAULT_SUPPLIER_PRICING_ENGINE_CONFIGURATION.loggingLevel,
    ) as SupplierPricingEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SUPPLIER_PRICING_ENGINE_AUTO_RECOVER",
      DEFAULT_SUPPLIER_PRICING_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SUPPLIER_PRICING_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
