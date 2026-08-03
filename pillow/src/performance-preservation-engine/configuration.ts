/** X3-12 — Externalized Performance Preservation Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type PerformancePreservationEngineConfiguration = {
  enabled: boolean;
  monitoringRulesEnabled: boolean;
  serviceQualityMonitoringEnabled: boolean;
  customerExperienceMonitoringEnabled: boolean;
  operationalPerformanceMonitoringEnabled: boolean;
  responseTimeMonitoringEnabled: boolean;
  fulfilmentQualityMonitoringEnabled: boolean;
  reliabilityMonitoringEnabled: boolean;
  performanceDegradationDetectionEnabled: boolean;
  qualityRegressionDetectionEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverCompromiseCustomerExperienceForScaling: true;
  preserveQualityTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  qualityThreshold: number;
  performanceThreshold: number;
  customerExperienceThreshold: number;
  degradationThreshold: number;
  regressionThreshold: number;
  responseTimeThreshold: number;
  reliabilityThreshold: number;
  lowQualityThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION: PerformancePreservationEngineConfiguration =
  {
    enabled: true,
    monitoringRulesEnabled: true,
    serviceQualityMonitoringEnabled: true,
    customerExperienceMonitoringEnabled: true,
    operationalPerformanceMonitoringEnabled: true,
    responseTimeMonitoringEnabled: true,
    fulfilmentQualityMonitoringEnabled: true,
    reliabilityMonitoringEnabled: true,
    performanceDegradationDetectionEnabled: true,
    qualityRegressionDetectionEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverCompromiseCustomerExperienceForScaling: true,
    preserveQualityTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
    qualityThreshold: 70,
    performanceThreshold: 70,
    customerExperienceThreshold: 75,
    degradationThreshold: 55,
    regressionThreshold: 50,
    responseTimeThreshold: 65,
    reliabilityThreshold: 70,
    lowQualityThreshold: 55,
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

export function loadPerformancePreservationEngineConfigFile(
  repositoryRoot: string,
): Partial<PerformancePreservationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "performance-preservation-engine.config.json"),
    join(repositoryRoot, "config", "performance-preservation-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<PerformancePreservationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPerformancePreservationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PerformancePreservationEngineConfiguration> = {},
): PerformancePreservationEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadPerformancePreservationEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<PerformancePreservationEngineConfiguration> = {
    enabled: envBool(
      "PERFORMANCE_PRESERVATION_ENGINE_ENABLED",
      DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "PERFORMANCE_PRESERVATION_ENGINE_TIMEOUT_MS",
      DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PERFORMANCE_PRESERVATION_ENGINE_MAX_RETRIES",
      DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    qualityThreshold: envInt(
      "PERFORMANCE_PRESERVATION_ENGINE_QUALITY_THRESHOLD",
      DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION.qualityThreshold,
    ),
    performanceThreshold: envInt(
      "PERFORMANCE_PRESERVATION_ENGINE_PERFORMANCE_THRESHOLD",
      DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION.performanceThreshold,
    ),
    customerExperienceThreshold: envInt(
      "PERFORMANCE_PRESERVATION_ENGINE_CX_THRESHOLD",
      DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION.customerExperienceThreshold,
    ),
    degradationThreshold: envInt(
      "PERFORMANCE_PRESERVATION_ENGINE_DEGRADATION_THRESHOLD",
      DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION.degradationThreshold,
    ),
    regressionThreshold: envInt(
      "PERFORMANCE_PRESERVATION_ENGINE_REGRESSION_THRESHOLD",
      DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION.regressionThreshold,
    ),
    lowQualityThreshold: envInt(
      "PERFORMANCE_PRESERVATION_ENGINE_LOW_QUALITY",
      DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION.lowQualityThreshold,
    ),
    loggingLevel: envString(
      "PERFORMANCE_PRESERVATION_ENGINE_LOG_LEVEL",
      DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as PerformancePreservationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PERFORMANCE_PRESERVATION_ENGINE_AUTO_RECOVER",
      DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PERFORMANCE_PRESERVATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverCompromiseCustomerExperienceForScaling: true,
    preserveQualityTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
