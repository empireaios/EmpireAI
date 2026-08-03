/** X4-14 — Externalized Regional Growth Optimizer configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type RegionalGrowthOptimizerConfiguration = {
  enabled: boolean;
  regionalOptimizationRulesEnabled: boolean;
  performanceThreshold: number;
  priorityCalculationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverOptimizeUsingUnvalidatedRegionalIntelligence: true;
  preserveOptimizationTraceability: true;
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

export const DEFAULT_REGIONAL_GROWTH_OPTIMIZER_CONFIGURATION: RegionalGrowthOptimizerConfiguration =
  {
    enabled: true,
    regionalOptimizationRulesEnabled: true,
    performanceThreshold: 55,
    priorityCalculationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverOptimizeUsingUnvalidatedRegionalIntelligence: true,
    preserveOptimizationTraceability: true,
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

export function loadRegionalGrowthOptimizerConfigFile(
  repositoryRoot: string,
): Partial<RegionalGrowthOptimizerConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "regional-growth-optimizer.config.json"),
    join(repositoryRoot, "config", "regional-growth-optimizer.config.json"),
  ];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      return JSON.parse(
        readFileSync(candidate, "utf8"),
      ) as Partial<RegionalGrowthOptimizerConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildRegionalGrowthOptimizerConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RegionalGrowthOptimizerConfiguration> = {},
): RegionalGrowthOptimizerConfiguration {
  const fileConfig = repositoryRoot
    ? loadRegionalGrowthOptimizerConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<RegionalGrowthOptimizerConfiguration> = {
    enabled: envBool(
      "REGIONAL_GROWTH_OPTIMIZER_ENABLED",
      DEFAULT_REGIONAL_GROWTH_OPTIMIZER_CONFIGURATION.enabled,
    ),
    performanceThreshold: envInt(
      "REGIONAL_GROWTH_OPTIMIZER_PERFORMANCE_THRESHOLD",
      DEFAULT_REGIONAL_GROWTH_OPTIMIZER_CONFIGURATION.performanceThreshold,
    ),
    connectionTimeoutMs: envInt(
      "REGIONAL_GROWTH_OPTIMIZER_TIMEOUT_MS",
      DEFAULT_REGIONAL_GROWTH_OPTIMIZER_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "REGIONAL_GROWTH_OPTIMIZER_MAX_RETRIES",
      DEFAULT_REGIONAL_GROWTH_OPTIMIZER_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "REGIONAL_GROWTH_OPTIMIZER_LOG_LEVEL",
      DEFAULT_REGIONAL_GROWTH_OPTIMIZER_CONFIGURATION.loggingLevel,
    ) as RegionalGrowthOptimizerConfiguration["loggingLevel"],
    autoRecover: envBool(
      "REGIONAL_GROWTH_OPTIMIZER_AUTO_RECOVER",
      DEFAULT_REGIONAL_GROWTH_OPTIMIZER_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_REGIONAL_GROWTH_OPTIMIZER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverOptimizeUsingUnvalidatedRegionalIntelligence: true,
    preserveOptimizationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveOperationalInformation: true,
  };
}
