/** X3-06 — Externalized Supplier Scale Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SupplierScaleEngineConfiguration = {
  enabled: boolean;
  monitoringRulesEnabled: boolean;
  capacityEvaluationRulesEnabled: boolean;
  scalingThresholdsEnabled: boolean;
  supplierOptimizationRulesEnabled: boolean;
  bottleneckDetectionEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverRecommendSupplierExpansionWithoutValidatedCapacity: true;
  preserveSupplierTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveSupplierInformation: true;
  minCapacityScore: number;
  minReliabilityScore: number;
  minFulfilmentReadiness: number;
  minPerformanceScore: number;
  bottleneckThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION: SupplierScaleEngineConfiguration =
  {
    enabled: true,
    monitoringRulesEnabled: true,
    capacityEvaluationRulesEnabled: true,
    scalingThresholdsEnabled: true,
    supplierOptimizationRulesEnabled: true,
    bottleneckDetectionEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendSupplierExpansionWithoutValidatedCapacity: true,
    preserveSupplierTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveSupplierInformation: true,
    minCapacityScore: 55,
    minReliabilityScore: 55,
    minFulfilmentReadiness: 55,
    minPerformanceScore: 55,
    bottleneckThreshold: 45,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
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

export function loadSupplierScaleEngineConfigFile(
  repositoryRoot: string,
): Partial<SupplierScaleEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "supplier-scale-engine.config.json"),
    join(repositoryRoot, "config", "supplier-scale-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<SupplierScaleEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSupplierScaleEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SupplierScaleEngineConfiguration> = {},
): SupplierScaleEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadSupplierScaleEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<SupplierScaleEngineConfiguration> = {
    enabled: envBool(
      "SUPPLIER_SCALE_ENGINE_ENABLED",
      DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "SUPPLIER_SCALE_ENGINE_TIMEOUT_MS",
      DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SUPPLIER_SCALE_ENGINE_MAX_RETRIES",
      DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    minCapacityScore: envInt(
      "SUPPLIER_SCALE_ENGINE_MIN_CAPACITY",
      DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION.minCapacityScore,
    ),
    minReliabilityScore: envInt(
      "SUPPLIER_SCALE_ENGINE_MIN_RELIABILITY",
      DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION.minReliabilityScore,
    ),
    minFulfilmentReadiness: envInt(
      "SUPPLIER_SCALE_ENGINE_MIN_FULFILMENT",
      DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION.minFulfilmentReadiness,
    ),
    minPerformanceScore: envInt(
      "SUPPLIER_SCALE_ENGINE_MIN_PERFORMANCE",
      DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION.minPerformanceScore,
    ),
    bottleneckThreshold: envInt(
      "SUPPLIER_SCALE_ENGINE_BOTTLENECK_THRESHOLD",
      DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION.bottleneckThreshold,
    ),
    loggingLevel: envString(
      "SUPPLIER_SCALE_ENGINE_LOG_LEVEL",
      DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION.loggingLevel,
    ) as SupplierScaleEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SUPPLIER_SCALE_ENGINE_AUTO_RECOVER",
      DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SUPPLIER_SCALE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendSupplierExpansionWithoutValidatedCapacity: true,
    preserveSupplierTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveSupplierInformation: true,
  };
}
