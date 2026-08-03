/** X3-18 — Externalized Scale Simulation Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ScaleSimulationEngineConfiguration = {
  enabled: boolean;
  simulationRulesEnabled: boolean;
  scalingScenarioSimulationEnabled: boolean;
  revenueOutcomeSimulationEnabled: boolean;
  profitOutcomeSimulationEnabled: boolean;
  operationalCapacitySimulationEnabled: boolean;
  supplierCapacitySimulationEnabled: boolean;
  workforceUtilizationSimulationEnabled: boolean;
  financialImpactSimulationEnabled: boolean;
  scalingRiskSimulationEnabled: boolean;
  multiScenarioComparisonEnabled: boolean;
  simulationOutcomeRankingEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverExecuteSimulatedActionsAgainstProduction: true;
  preserveSimulationTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
  simulationScoreThreshold: number;
  highScoreThreshold: number;
  criticalScoreThreshold: number;
  revenueProjectionThreshold: number;
  profitProjectionThreshold: number;
  capacityProjectionThreshold: number;
  riskProjectionThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_SCALE_SIMULATION_ENGINE_CONFIGURATION: ScaleSimulationEngineConfiguration =
  {
    enabled: true,
    simulationRulesEnabled: true,
    scalingScenarioSimulationEnabled: true,
    revenueOutcomeSimulationEnabled: true,
    profitOutcomeSimulationEnabled: true,
    operationalCapacitySimulationEnabled: true,
    supplierCapacitySimulationEnabled: true,
    workforceUtilizationSimulationEnabled: true,
    financialImpactSimulationEnabled: true,
    scalingRiskSimulationEnabled: true,
    multiScenarioComparisonEnabled: true,
    simulationOutcomeRankingEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExecuteSimulatedActionsAgainstProduction: true,
    preserveSimulationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
    simulationScoreThreshold: 55,
    highScoreThreshold: 70,
    criticalScoreThreshold: 85,
    revenueProjectionThreshold: 60,
    profitProjectionThreshold: 60,
    capacityProjectionThreshold: 60,
    riskProjectionThreshold: 60,
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

export function loadScaleSimulationEngineConfigFile(
  repositoryRoot: string,
): Partial<ScaleSimulationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "scale-simulation-engine.config.json"),
    join(repositoryRoot, "config", "scale-simulation-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ScaleSimulationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildScaleSimulationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ScaleSimulationEngineConfiguration> = {},
): ScaleSimulationEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadScaleSimulationEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ScaleSimulationEngineConfiguration> = {
    enabled: envBool(
      "SCALE_SIMULATION_ENGINE_ENABLED",
      DEFAULT_SCALE_SIMULATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "SCALE_SIMULATION_ENGINE_TIMEOUT_MS",
      DEFAULT_SCALE_SIMULATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "SCALE_SIMULATION_ENGINE_MAX_RETRIES",
      DEFAULT_SCALE_SIMULATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    simulationScoreThreshold: envInt(
      "SCALE_SIMULATION_ENGINE_SCORE_THRESHOLD",
      DEFAULT_SCALE_SIMULATION_ENGINE_CONFIGURATION.simulationScoreThreshold,
    ),
    highScoreThreshold: envInt(
      "SCALE_SIMULATION_ENGINE_HIGH_SCORE",
      DEFAULT_SCALE_SIMULATION_ENGINE_CONFIGURATION.highScoreThreshold,
    ),
    criticalScoreThreshold: envInt(
      "SCALE_SIMULATION_ENGINE_CRITICAL_SCORE",
      DEFAULT_SCALE_SIMULATION_ENGINE_CONFIGURATION.criticalScoreThreshold,
    ),
    loggingLevel: envString(
      "SCALE_SIMULATION_ENGINE_LOG_LEVEL",
      DEFAULT_SCALE_SIMULATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as ScaleSimulationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SCALE_SIMULATION_ENGINE_AUTO_RECOVER",
      DEFAULT_SCALE_SIMULATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SCALE_SIMULATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExecuteSimulatedActionsAgainstProduction: true,
    preserveSimulationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
