/** X3-04 — Externalized Capacity Planning Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type CapacityPlanningEngineConfiguration = {
  enabled: boolean;
  monitoringRulesEnabled: boolean;
  forecastingRulesEnabled: boolean;
  bottleneckDetectionEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverRecommendBeyondValidatedLimits: true;
  preservePlanningTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  utilizationWarnThreshold: number;
  utilizationCriticalThreshold: number;
  bottleneckDetectionThreshold: number;
  forecastHorizonDays: number;
  minExpansionConfidence: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_CAPACITY_PLANNING_ENGINE_CONFIGURATION: CapacityPlanningEngineConfiguration =
  {
    enabled: true,
    monitoringRulesEnabled: true,
    forecastingRulesEnabled: true,
    bottleneckDetectionEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendBeyondValidatedLimits: true,
    preservePlanningTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
    utilizationWarnThreshold: 70,
    utilizationCriticalThreshold: 85,
    bottleneckDetectionThreshold: 80,
    forecastHorizonDays: 30,
    minExpansionConfidence: 55,
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

export function loadCapacityPlanningEngineConfigFile(
  repositoryRoot: string,
): Partial<CapacityPlanningEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "capacity-planning-engine.config.json"),
    join(repositoryRoot, "config", "capacity-planning-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<CapacityPlanningEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildCapacityPlanningEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<CapacityPlanningEngineConfiguration> = {},
): CapacityPlanningEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadCapacityPlanningEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<CapacityPlanningEngineConfiguration> = {
    enabled: envBool(
      "CAPACITY_PLANNING_ENGINE_ENABLED",
      DEFAULT_CAPACITY_PLANNING_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "CAPACITY_PLANNING_ENGINE_TIMEOUT_MS",
      DEFAULT_CAPACITY_PLANNING_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "CAPACITY_PLANNING_ENGINE_MAX_RETRIES",
      DEFAULT_CAPACITY_PLANNING_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    utilizationCriticalThreshold: envInt(
      "CAPACITY_PLANNING_ENGINE_UTILIZATION_CRITICAL",
      DEFAULT_CAPACITY_PLANNING_ENGINE_CONFIGURATION.utilizationCriticalThreshold,
    ),
    bottleneckDetectionThreshold: envInt(
      "CAPACITY_PLANNING_ENGINE_BOTTLENECK_THRESHOLD",
      DEFAULT_CAPACITY_PLANNING_ENGINE_CONFIGURATION.bottleneckDetectionThreshold,
    ),
    forecastHorizonDays: envInt(
      "CAPACITY_PLANNING_ENGINE_FORECAST_DAYS",
      DEFAULT_CAPACITY_PLANNING_ENGINE_CONFIGURATION.forecastHorizonDays,
    ),
    loggingLevel: envString(
      "CAPACITY_PLANNING_ENGINE_LOG_LEVEL",
      DEFAULT_CAPACITY_PLANNING_ENGINE_CONFIGURATION.loggingLevel,
    ) as CapacityPlanningEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CAPACITY_PLANNING_ENGINE_AUTO_RECOVER",
      DEFAULT_CAPACITY_PLANNING_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CAPACITY_PLANNING_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendBeyondValidatedLimits: true,
    preservePlanningTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
