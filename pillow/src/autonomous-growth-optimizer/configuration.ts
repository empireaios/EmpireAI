/** X3-15 — Externalized Autonomous Growth Optimizer configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AutonomousGrowthOptimizerConfiguration = {
  enabled: boolean;
  optimizationRulesEnabled: boolean;
  enterpriseGrowthMonitoringEnabled: boolean;
  revenueGrowthMonitoringEnabled: boolean;
  profitGrowthMonitoringEnabled: boolean;
  customerGrowthMonitoringEnabled: boolean;
  operationalGrowthMonitoringEnabled: boolean;
  growthOpportunityIdentificationEnabled: boolean;
  growthConstraintIdentificationEnabled: boolean;
  growthStrategyOptimizationEnabled: boolean;
  growthPriorityRankingEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverOptimizeGrowthBeyondValidatedOperationalLimits: true;
  preserveOptimizationTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  growthOpportunityThreshold: number;
  highPriorityThreshold: number;
  criticalPriorityThreshold: number;
  enterpriseGrowthThreshold: number;
  revenueGrowthThreshold: number;
  profitGrowthThreshold: number;
  customerGrowthThreshold: number;
  operationalGrowthThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_AUTONOMOUS_GROWTH_OPTIMIZER_CONFIGURATION: AutonomousGrowthOptimizerConfiguration =
  {
    enabled: true,
    optimizationRulesEnabled: true,
    enterpriseGrowthMonitoringEnabled: true,
    revenueGrowthMonitoringEnabled: true,
    profitGrowthMonitoringEnabled: true,
    customerGrowthMonitoringEnabled: true,
    operationalGrowthMonitoringEnabled: true,
    growthOpportunityIdentificationEnabled: true,
    growthConstraintIdentificationEnabled: true,
    growthStrategyOptimizationEnabled: true,
    growthPriorityRankingEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverOptimizeGrowthBeyondValidatedOperationalLimits: true,
    preserveOptimizationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
    growthOpportunityThreshold: 55,
    highPriorityThreshold: 70,
    criticalPriorityThreshold: 85,
    enterpriseGrowthThreshold: 60,
    revenueGrowthThreshold: 60,
    profitGrowthThreshold: 60,
    customerGrowthThreshold: 60,
    operationalGrowthThreshold: 60,
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

export function loadAutonomousGrowthOptimizerConfigFile(
  repositoryRoot: string,
): Partial<AutonomousGrowthOptimizerConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "autonomous-growth-optimizer.config.json"),
    join(repositoryRoot, "config", "autonomous-growth-optimizer.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AutonomousGrowthOptimizerConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAutonomousGrowthOptimizerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AutonomousGrowthOptimizerConfiguration> = {},
): AutonomousGrowthOptimizerConfiguration {
  const fileConfig = repositoryRoot
    ? loadAutonomousGrowthOptimizerConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<AutonomousGrowthOptimizerConfiguration> = {
    enabled: envBool(
      "AUTONOMOUS_GROWTH_OPTIMIZER_ENABLED",
      DEFAULT_AUTONOMOUS_GROWTH_OPTIMIZER_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "AUTONOMOUS_GROWTH_OPTIMIZER_TIMEOUT_MS",
      DEFAULT_AUTONOMOUS_GROWTH_OPTIMIZER_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "AUTONOMOUS_GROWTH_OPTIMIZER_MAX_RETRIES",
      DEFAULT_AUTONOMOUS_GROWTH_OPTIMIZER_CONFIGURATION.maxRetryAttempts,
    ),
    growthOpportunityThreshold: envInt(
      "AUTONOMOUS_GROWTH_OPTIMIZER_OPPORTUNITY_THRESHOLD",
      DEFAULT_AUTONOMOUS_GROWTH_OPTIMIZER_CONFIGURATION.growthOpportunityThreshold,
    ),
    highPriorityThreshold: envInt(
      "AUTONOMOUS_GROWTH_OPTIMIZER_HIGH_PRIORITY",
      DEFAULT_AUTONOMOUS_GROWTH_OPTIMIZER_CONFIGURATION.highPriorityThreshold,
    ),
    criticalPriorityThreshold: envInt(
      "AUTONOMOUS_GROWTH_OPTIMIZER_CRITICAL_PRIORITY",
      DEFAULT_AUTONOMOUS_GROWTH_OPTIMIZER_CONFIGURATION.criticalPriorityThreshold,
    ),
    loggingLevel: envString(
      "AUTONOMOUS_GROWTH_OPTIMIZER_LOG_LEVEL",
      DEFAULT_AUTONOMOUS_GROWTH_OPTIMIZER_CONFIGURATION.loggingLevel,
    ) as AutonomousGrowthOptimizerConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AUTONOMOUS_GROWTH_OPTIMIZER_AUTO_RECOVER",
      DEFAULT_AUTONOMOUS_GROWTH_OPTIMIZER_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_AUTONOMOUS_GROWTH_OPTIMIZER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverOptimizeGrowthBeyondValidatedOperationalLimits: true,
    preserveOptimizationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
