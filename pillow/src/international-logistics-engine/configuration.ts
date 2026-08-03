/** X4-08 — Externalized International Logistics Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type InternationalLogisticsEngineConfiguration = {
  enabled: boolean;
  logisticsProviderRulesEnabled: boolean;
  routeOptimizationRulesEnabled: boolean;
  deliveryThreshold: number;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverRecommendWithUnvalidatedLogisticsData: true;
  preserveLogisticsTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_INTERNATIONAL_LOGISTICS_ENGINE_CONFIGURATION: InternationalLogisticsEngineConfiguration =
  {
    enabled: true,
    logisticsProviderRulesEnabled: true,
    routeOptimizationRulesEnabled: true,
    deliveryThreshold: 72,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendWithUnvalidatedLogisticsData: true,
    preserveLogisticsTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
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

export function loadInternationalLogisticsEngineConfigFile(
  repositoryRoot: string,
): Partial<InternationalLogisticsEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "international-logistics-engine.config.json"),
    join(repositoryRoot, "config", "international-logistics-engine.config.json"),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      return JSON.parse(
        readFileSync(candidate, "utf8"),
      ) as Partial<InternationalLogisticsEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildInternationalLogisticsEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<InternationalLogisticsEngineConfiguration> = {},
): InternationalLogisticsEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadInternationalLogisticsEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<InternationalLogisticsEngineConfiguration> = {
    enabled: envBool(
      "INTERNATIONAL_LOGISTICS_ENGINE_ENABLED",
      DEFAULT_INTERNATIONAL_LOGISTICS_ENGINE_CONFIGURATION.enabled,
    ),
    deliveryThreshold: envInt(
      "INTERNATIONAL_LOGISTICS_ENGINE_DELIVERY_THRESHOLD",
      DEFAULT_INTERNATIONAL_LOGISTICS_ENGINE_CONFIGURATION.deliveryThreshold,
    ),
    connectionTimeoutMs: envInt(
      "INTERNATIONAL_LOGISTICS_ENGINE_TIMEOUT_MS",
      DEFAULT_INTERNATIONAL_LOGISTICS_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "INTERNATIONAL_LOGISTICS_ENGINE_MAX_RETRIES",
      DEFAULT_INTERNATIONAL_LOGISTICS_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "INTERNATIONAL_LOGISTICS_ENGINE_LOG_LEVEL",
      DEFAULT_INTERNATIONAL_LOGISTICS_ENGINE_CONFIGURATION.loggingLevel,
    ) as InternationalLogisticsEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "INTERNATIONAL_LOGISTICS_ENGINE_AUTO_RECOVER",
      DEFAULT_INTERNATIONAL_LOGISTICS_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_INTERNATIONAL_LOGISTICS_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendWithUnvalidatedLogisticsData: true,
    preserveLogisticsTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
