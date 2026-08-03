/** X3-11 — Externalized Operational Elasticity Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type OperationalElasticityEngineConfiguration = {
  enabled: boolean;
  monitoringRulesEnabled: boolean;
  demandMonitoringEnabled: boolean;
  utilizationMonitoringEnabled: boolean;
  capacityScaleUpEnabled: boolean;
  capacityScaleDownEnabled: boolean;
  workloadBalancingEnabled: boolean;
  resourceOptimizationEnabled: boolean;
  overcapacityDetectionEnabled: boolean;
  undercapacityDetectionEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverExceedValidatedOperationalLimits: true;
  preserveElasticityTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  utilizationThreshold: number;
  demandThreshold: number;
  overcapacityThreshold: number;
  undercapacityThreshold: number;
  targetUtilizationDefault: number;
  maxScalingAdjustment: number;
  highUtilizationThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION: OperationalElasticityEngineConfiguration =
  {
    enabled: true,
    monitoringRulesEnabled: true,
    demandMonitoringEnabled: true,
    utilizationMonitoringEnabled: true,
    capacityScaleUpEnabled: true,
    capacityScaleDownEnabled: true,
    workloadBalancingEnabled: true,
    resourceOptimizationEnabled: true,
    overcapacityDetectionEnabled: true,
    undercapacityDetectionEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExceedValidatedOperationalLimits: true,
    preserveElasticityTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
    utilizationThreshold: 70,
    demandThreshold: 55,
    overcapacityThreshold: 85,
    undercapacityThreshold: 35,
    targetUtilizationDefault: 70,
    maxScalingAdjustment: 20,
    highUtilizationThreshold: 85,
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

export function loadOperationalElasticityEngineConfigFile(
  repositoryRoot: string,
): Partial<OperationalElasticityEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "operational-elasticity-engine.config.json"),
    join(repositoryRoot, "config", "operational-elasticity-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<OperationalElasticityEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildOperationalElasticityEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<OperationalElasticityEngineConfiguration> = {},
): OperationalElasticityEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadOperationalElasticityEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<OperationalElasticityEngineConfiguration> = {
    enabled: envBool(
      "OPERATIONAL_ELASTICITY_ENGINE_ENABLED",
      DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "OPERATIONAL_ELASTICITY_ENGINE_TIMEOUT_MS",
      DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "OPERATIONAL_ELASTICITY_ENGINE_MAX_RETRIES",
      DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    utilizationThreshold: envInt(
      "OPERATIONAL_ELASTICITY_ENGINE_UTILIZATION_THRESHOLD",
      DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION.utilizationThreshold,
    ),
    demandThreshold: envInt(
      "OPERATIONAL_ELASTICITY_ENGINE_DEMAND_THRESHOLD",
      DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION.demandThreshold,
    ),
    overcapacityThreshold: envInt(
      "OPERATIONAL_ELASTICITY_ENGINE_OVERCAPACITY_THRESHOLD",
      DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION.overcapacityThreshold,
    ),
    undercapacityThreshold: envInt(
      "OPERATIONAL_ELASTICITY_ENGINE_UNDERCAPACITY_THRESHOLD",
      DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION.undercapacityThreshold,
    ),
    maxScalingAdjustment: envInt(
      "OPERATIONAL_ELASTICITY_ENGINE_MAX_SCALING_ADJUSTMENT",
      DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION.maxScalingAdjustment,
    ),
    highUtilizationThreshold: envInt(
      "OPERATIONAL_ELASTICITY_ENGINE_HIGH_UTILIZATION",
      DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION.highUtilizationThreshold,
    ),
    loggingLevel: envString(
      "OPERATIONAL_ELASTICITY_ENGINE_LOG_LEVEL",
      DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION.loggingLevel,
    ) as OperationalElasticityEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "OPERATIONAL_ELASTICITY_ENGINE_AUTO_RECOVER",
      DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_OPERATIONAL_ELASTICITY_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExceedValidatedOperationalLimits: true,
    preserveElasticityTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
