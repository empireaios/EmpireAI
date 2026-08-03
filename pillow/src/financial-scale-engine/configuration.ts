/** X3-07 — Externalized Financial Scale Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type FinancialScaleEngineConfiguration = {
  enabled: boolean;
  monitoringRulesEnabled: boolean;
  capitalEvaluationRulesEnabled: boolean;
  scalingThresholdsEnabled: boolean;
  financialOptimizationRulesEnabled: boolean;
  bottleneckDetectionEnabled: boolean;
  recommendationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  neverRecommendScalingWithoutValidatedFinancialReadiness: true;
  preserveFinancialTraceability: true;
  preserveAuditability: true;
  preserveFinancialIntegrity: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveFinancialInformation: true;
  minCapitalRequirement: number;
  minProfitabilityScore: number;
  minInvestmentEfficiencyScore: number;
  minCashFlowReadiness: number;
  bottleneckThreshold: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION: FinancialScaleEngineConfiguration =
  {
    enabled: true,
    monitoringRulesEnabled: true,
    capitalEvaluationRulesEnabled: true,
    scalingThresholdsEnabled: true,
    financialOptimizationRulesEnabled: true,
    bottleneckDetectionEnabled: true,
    recommendationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendScalingWithoutValidatedFinancialReadiness: true,
    preserveFinancialTraceability: true,
    preserveAuditability: true,
    preserveFinancialIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveFinancialInformation: true,
    minCapitalRequirement: 55,
    minProfitabilityScore: 55,
    minInvestmentEfficiencyScore: 55,
    minCashFlowReadiness: 55,
    bottleneckThreshold: 45,
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

export function loadFinancialScaleEngineConfigFile(
  repositoryRoot: string,
): Partial<FinancialScaleEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "financial-scale-engine.config.json"),
    join(repositoryRoot, "config", "financial-scale-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<FinancialScaleEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildFinancialScaleEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FinancialScaleEngineConfiguration> = {},
): FinancialScaleEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadFinancialScaleEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<FinancialScaleEngineConfiguration> = {
    enabled: envBool(
      "FINANCIAL_SCALE_ENGINE_ENABLED",
      DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "FINANCIAL_SCALE_ENGINE_TIMEOUT_MS",
      DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "FINANCIAL_SCALE_ENGINE_MAX_RETRIES",
      DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    minCapitalRequirement: envInt(
      "FINANCIAL_SCALE_ENGINE_MIN_CAPITAL",
      DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION.minCapitalRequirement,
    ),
    minProfitabilityScore: envInt(
      "FINANCIAL_SCALE_ENGINE_MIN_PROFITABILITY",
      DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION.minProfitabilityScore,
    ),
    minInvestmentEfficiencyScore: envInt(
      "FINANCIAL_SCALE_ENGINE_MIN_INVESTMENT_EFFICIENCY",
      DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION.minInvestmentEfficiencyScore,
    ),
    minCashFlowReadiness: envInt(
      "FINANCIAL_SCALE_ENGINE_MIN_CASH_FLOW",
      DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION.minCashFlowReadiness,
    ),
    bottleneckThreshold: envInt(
      "FINANCIAL_SCALE_ENGINE_BOTTLENECK_THRESHOLD",
      DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION.bottleneckThreshold,
    ),
    loggingLevel: envString(
      "FINANCIAL_SCALE_ENGINE_LOG_LEVEL",
      DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION.loggingLevel,
    ) as FinancialScaleEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "FINANCIAL_SCALE_ENGINE_AUTO_RECOVER",
      DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_FINANCIAL_SCALE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    neverRecommendScalingWithoutValidatedFinancialReadiness: true,
    preserveFinancialTraceability: true,
    preserveAuditability: true,
    preserveFinancialIntegrity: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveFinancialInformation: true,
  };
}
