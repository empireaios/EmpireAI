/** R5-19 — Externalized Autonomous Marketing Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AutonomousMarketingEngineConfiguration = {
  enabled: boolean;
  optimizationRulesEnabled: boolean;
  automationApprovalRulesEnabled: boolean;
  decisionThresholdsEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExecuteHighImpactActionsWithoutApproval: true;
  maskSensitiveValues: true;
  performanceDeclineThreshold: number;
  minConfidenceScore: number;
  maxOptimizationsPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_AUTONOMOUS_MARKETING_ENGINE_CONFIGURATION: AutonomousMarketingEngineConfiguration =
  {
    enabled: true,
    optimizationRulesEnabled: true,
    automationApprovalRulesEnabled: true,
    decisionThresholdsEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExecuteHighImpactActionsWithoutApproval: true,
    maskSensitiveValues: true,
    performanceDeclineThreshold: 15,
    minConfidenceScore: 60,
    maxOptimizationsPerCycle: 8,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
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

export function loadAutonomousMarketingEngineConfigFile(
  repositoryRoot: string,
): Partial<AutonomousMarketingEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "autonomous-marketing-engine.config.json"),
    join(repositoryRoot, "config", "autonomous-marketing-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AutonomousMarketingEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAutonomousMarketingEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AutonomousMarketingEngineConfiguration> = {},
): AutonomousMarketingEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadAutonomousMarketingEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<AutonomousMarketingEngineConfiguration> = {
    enabled: envBool(
      "AUTONOMOUS_MARKETING_ENGINE_ENABLED",
      DEFAULT_AUTONOMOUS_MARKETING_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "AUTONOMOUS_MARKETING_ENGINE_TIMEOUT_MS",
      DEFAULT_AUTONOMOUS_MARKETING_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "AUTONOMOUS_MARKETING_ENGINE_MAX_RETRIES",
      DEFAULT_AUTONOMOUS_MARKETING_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "AUTONOMOUS_MARKETING_ENGINE_LOG_LEVEL",
      DEFAULT_AUTONOMOUS_MARKETING_ENGINE_CONFIGURATION.loggingLevel,
    ) as AutonomousMarketingEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "AUTONOMOUS_MARKETING_ENGINE_AUTO_RECOVER",
      DEFAULT_AUTONOMOUS_MARKETING_ENGINE_CONFIGURATION.autoRecover,
    ),
    performanceDeclineThreshold: envInt(
      "AUTONOMOUS_MARKETING_ENGINE_DECLINE_THRESHOLD",
      DEFAULT_AUTONOMOUS_MARKETING_ENGINE_CONFIGURATION.performanceDeclineThreshold,
    ),
    minConfidenceScore: envInt(
      "AUTONOMOUS_MARKETING_ENGINE_MIN_CONFIDENCE",
      DEFAULT_AUTONOMOUS_MARKETING_ENGINE_CONFIGURATION.minConfidenceScore,
    ),
    maxOptimizationsPerCycle: envInt(
      "AUTONOMOUS_MARKETING_ENGINE_MAX_OPTIMIZATIONS",
      DEFAULT_AUTONOMOUS_MARKETING_ENGINE_CONFIGURATION.maxOptimizationsPerCycle,
    ),
  };

  return {
    ...DEFAULT_AUTONOMOUS_MARKETING_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExecuteHighImpactActionsWithoutApproval: true,
    maskSensitiveValues: true,
  };
}
