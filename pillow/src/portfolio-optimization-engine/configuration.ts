/** X2-16 — Externalized Portfolio Optimization Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type PortfolioOptimizationEngineConfiguration = {
  enabled: boolean;
  optimizationRulesEnabled: boolean;
  priorityCalculationRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverExecuteOptimizationAutomaticallyBeyondConfiguredApprovalPolicies: true;
  requireApprovalForHighImpactOptimizations: boolean;
  preserveOptimizationTraceability: true;
  preserveAuditability: true;
  preserveEnterpriseIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
  minimumExpectedBenefitThreshold: number;
  highPriorityBenefitThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_PORTFOLIO_OPTIMIZATION_ENGINE_CONFIGURATION: PortfolioOptimizationEngineConfiguration =
  {
    enabled: true,
    optimizationRulesEnabled: true,
    priorityCalculationRulesEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExecuteOptimizationAutomaticallyBeyondConfiguredApprovalPolicies: true,
    requireApprovalForHighImpactOptimizations: true,
    preserveOptimizationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
    minimumExpectedBenefitThreshold: 10,
    highPriorityBenefitThreshold: 40,
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

export function loadPortfolioOptimizationEngineConfigFile(
  repositoryRoot: string,
): Partial<PortfolioOptimizationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "portfolio-optimization-engine.config.json"),
    join(repositoryRoot, "config", "portfolio-optimization-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<PortfolioOptimizationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPortfolioOptimizationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PortfolioOptimizationEngineConfiguration> = {},
): PortfolioOptimizationEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadPortfolioOptimizationEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<PortfolioOptimizationEngineConfiguration> = {
    enabled: envBool(
      "PORTFOLIO_OPTIMIZATION_ENGINE_ENABLED",
      DEFAULT_PORTFOLIO_OPTIMIZATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "PORTFOLIO_OPTIMIZATION_ENGINE_TIMEOUT_MS",
      DEFAULT_PORTFOLIO_OPTIMIZATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "PORTFOLIO_OPTIMIZATION_ENGINE_MAX_RETRIES",
      DEFAULT_PORTFOLIO_OPTIMIZATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    highPriorityBenefitThreshold: envInt(
      "PORTFOLIO_OPTIMIZATION_ENGINE_HIGH_PRIORITY_THRESHOLD",
      DEFAULT_PORTFOLIO_OPTIMIZATION_ENGINE_CONFIGURATION.highPriorityBenefitThreshold,
    ),
    loggingLevel: envString(
      "PORTFOLIO_OPTIMIZATION_ENGINE_LOG_LEVEL",
      DEFAULT_PORTFOLIO_OPTIMIZATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as PortfolioOptimizationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PORTFOLIO_OPTIMIZATION_ENGINE_AUTO_RECOVER",
      DEFAULT_PORTFOLIO_OPTIMIZATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PORTFOLIO_OPTIMIZATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverExecuteOptimizationAutomaticallyBeyondConfiguredApprovalPolicies: true,
    preserveOptimizationTraceability: true,
    preserveAuditability: true,
    preserveEnterpriseIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}
