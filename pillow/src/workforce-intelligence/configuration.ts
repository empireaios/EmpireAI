/** X3-08 — Externalized Workforce Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type WorkforceIntelligenceConfiguration = {
  enabled: boolean;
  monitoringRulesEnabled: boolean;
  capacityEvaluationRulesEnabled: boolean;
  utilizationThresholdsEnabled: boolean;
  workforceOptimizationRulesEnabled: boolean;
  bottleneckDetectionEnabled: boolean;
  underutilizedDetectionEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverOverloadWorkforceBeyondValidatedLimits: true;
  preserveWorkforceTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveOperationalInformation: true;
  minAgentUtilization: number;
  minWorkloadDistribution: number;
  minThroughputMetrics: number;
  minWorkforceEfficiencyScore: number;
  bottleneckThreshold: number;
  underutilizedThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION: WorkforceIntelligenceConfiguration =
  {
    enabled: true,
    monitoringRulesEnabled: true,
    capacityEvaluationRulesEnabled: true,
    utilizationThresholdsEnabled: true,
    workforceOptimizationRulesEnabled: true,
    bottleneckDetectionEnabled: true,
    underutilizedDetectionEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverOverloadWorkforceBeyondValidatedLimits: true,
    preserveWorkforceTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
    minAgentUtilization: 55,
    minWorkloadDistribution: 55,
    minThroughputMetrics: 55,
    minWorkforceEfficiencyScore: 55,
    bottleneckThreshold: 45,
    underutilizedThreshold: 35,
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

export function loadWorkforceIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<WorkforceIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "workforce-intelligence.config.json"),
    join(repositoryRoot, "config", "workforce-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<WorkforceIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildWorkforceIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<WorkforceIntelligenceConfiguration> = {},
): WorkforceIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadWorkforceIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<WorkforceIntelligenceConfiguration> = {
    enabled: envBool(
      "WORKFORCE_INTELLIGENCE_ENABLED",
      DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "WORKFORCE_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "WORKFORCE_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    minAgentUtilization: envInt(
      "WORKFORCE_INTELLIGENCE_MIN_UTILIZATION",
      DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION.minAgentUtilization,
    ),
    minWorkloadDistribution: envInt(
      "WORKFORCE_INTELLIGENCE_MIN_DISTRIBUTION",
      DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION.minWorkloadDistribution,
    ),
    minThroughputMetrics: envInt(
      "WORKFORCE_INTELLIGENCE_MIN_THROUGHPUT",
      DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION.minThroughputMetrics,
    ),
    minWorkforceEfficiencyScore: envInt(
      "WORKFORCE_INTELLIGENCE_MIN_EFFICIENCY",
      DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION.minWorkforceEfficiencyScore,
    ),
    bottleneckThreshold: envInt(
      "WORKFORCE_INTELLIGENCE_BOTTLENECK_THRESHOLD",
      DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION.bottleneckThreshold,
    ),
    underutilizedThreshold: envInt(
      "WORKFORCE_INTELLIGENCE_UNDERUTILIZED_THRESHOLD",
      DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION.underutilizedThreshold,
    ),
    loggingLevel: envString(
      "WORKFORCE_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as WorkforceIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "WORKFORCE_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_WORKFORCE_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverOverloadWorkforceBeyondValidatedLimits: true,
    preserveWorkforceTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
