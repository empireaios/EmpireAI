/** X3-17 — Externalized Profit Scaling Engine configuration. */



import { readFileSync, existsSync } from "node:fs";

import { join } from "node:path";



export type ProfitScalingEngineConfiguration = {

  enabled: boolean;

  scalingRulesEnabled: boolean;

  profitGrowthMonitoringEnabled: boolean;

  grossMarginMonitoringEnabled: boolean;

  netMarginMonitoringEnabled: boolean;

  operatingMarginMonitoringEnabled: boolean;

  scalingCostMonitoringEnabled: boolean;

  roiMonitoringEnabled: boolean;

  profitErosionDetectionEnabled: boolean;

  unprofitableGrowthDetectionEnabled: boolean;

  profitOptimizationDuringScalingEnabled: boolean;

  recommendationRulesEnabled: boolean;

  validationRulesEnabled: boolean;

  healthMonitoringRulesEnabled: boolean;

  neverExposeCredentials: true;

  neverExposeAuthenticationTokens: true;

  neverPrioritizeGrowthOverValidatedProfitability: true;

  preserveProfitTraceability: true;

  preserveAuditability: true;

  preserveFinancialIntegrity: true;

  structuralSignalsOnly: true;

  maskSensitiveValues: true;

  neverLogSensitiveFinancialInformation: true;

  profitOptimizationThreshold: number;

  highOptimizationThreshold: number;

  criticalOptimizationThreshold: number;

  profitGrowthThreshold: number;

  grossMarginThreshold: number;

  netMarginThreshold: number;

  operatingMarginThreshold: number;

  scalingCostThreshold: number;

  roiThreshold: number;

  connectionTimeoutMs: number;

  maxRetryAttempts: number;

  retryDelayMs: number;

  retryBackoffMultiplier: number;

  loggingLevel: "debug" | "info" | "warn" | "error";

  autoRecover: boolean;

};



export const DEFAULT_PROFIT_SCALING_ENGINE_CONFIGURATION: ProfitScalingEngineConfiguration =

  {

    enabled: true,

    scalingRulesEnabled: true,

    profitGrowthMonitoringEnabled: true,

    grossMarginMonitoringEnabled: true,

    netMarginMonitoringEnabled: true,

    operatingMarginMonitoringEnabled: true,

    scalingCostMonitoringEnabled: true,

    roiMonitoringEnabled: true,

    profitErosionDetectionEnabled: true,

    unprofitableGrowthDetectionEnabled: true,

    profitOptimizationDuringScalingEnabled: true,

    recommendationRulesEnabled: true,

    validationRulesEnabled: true,

    healthMonitoringRulesEnabled: true,

    neverExposeCredentials: true,

    neverExposeAuthenticationTokens: true,

    neverPrioritizeGrowthOverValidatedProfitability: true,

    preserveProfitTraceability: true,

    preserveAuditability: true,

    preserveFinancialIntegrity: true,

    structuralSignalsOnly: true,

    maskSensitiveValues: true,

    neverLogSensitiveFinancialInformation: true,

    profitOptimizationThreshold: 55,

    highOptimizationThreshold: 70,

    criticalOptimizationThreshold: 85,

    profitGrowthThreshold: 60,

    grossMarginThreshold: 60,

    netMarginThreshold: 60,

    operatingMarginThreshold: 60,

    scalingCostThreshold: 60,

    roiThreshold: 60,

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



export function loadProfitScalingEngineConfigFile(

  repositoryRoot: string,

): Partial<ProfitScalingEngineConfiguration> | null {

  const candidates = [

    join(repositoryRoot, "profit-scaling-engine.config.json"),

    join(repositoryRoot, "config", "profit-scaling-engine.config.json"),

  ];

  for (const path of candidates) {

    if (!existsSync(path)) continue;

    try {

      return JSON.parse(

        readFileSync(path, "utf8"),

      ) as Partial<ProfitScalingEngineConfiguration>;

    } catch {

      return null;

    }

  }

  return null;

}



export function buildProfitScalingEngineConfiguration(

  repositoryRoot?: string,

  overrides: Partial<ProfitScalingEngineConfiguration> = {},

): ProfitScalingEngineConfiguration {

  const fileConfig = repositoryRoot

    ? loadProfitScalingEngineConfigFile(repositoryRoot)

    : null;

  const envConfig: Partial<ProfitScalingEngineConfiguration> = {

    enabled: envBool(

      "PROFIT_SCALING_ENGINE_ENABLED",

      DEFAULT_PROFIT_SCALING_ENGINE_CONFIGURATION.enabled,

    ),

    connectionTimeoutMs: envInt(

      "PROFIT_SCALING_ENGINE_TIMEOUT_MS",

      DEFAULT_PROFIT_SCALING_ENGINE_CONFIGURATION.connectionTimeoutMs,

    ),

    maxRetryAttempts: envInt(

      "PROFIT_SCALING_ENGINE_MAX_RETRIES",

      DEFAULT_PROFIT_SCALING_ENGINE_CONFIGURATION.maxRetryAttempts,

    ),

    profitOptimizationThreshold: envInt(

      "PROFIT_SCALING_ENGINE_OPTIMIZATION_THRESHOLD",

      DEFAULT_PROFIT_SCALING_ENGINE_CONFIGURATION.profitOptimizationThreshold,

    ),

    highOptimizationThreshold: envInt(

      "PROFIT_SCALING_ENGINE_HIGH_OPTIMIZATION",

      DEFAULT_PROFIT_SCALING_ENGINE_CONFIGURATION.highOptimizationThreshold,

    ),

    criticalOptimizationThreshold: envInt(

      "PROFIT_SCALING_ENGINE_CRITICAL_OPTIMIZATION",

      DEFAULT_PROFIT_SCALING_ENGINE_CONFIGURATION.criticalOptimizationThreshold,

    ),

    loggingLevel: envString(

      "PROFIT_SCALING_ENGINE_LOG_LEVEL",

      DEFAULT_PROFIT_SCALING_ENGINE_CONFIGURATION.loggingLevel,

    ) as ProfitScalingEngineConfiguration["loggingLevel"],

    autoRecover: envBool(

      "PROFIT_SCALING_ENGINE_AUTO_RECOVER",

      DEFAULT_PROFIT_SCALING_ENGINE_CONFIGURATION.autoRecover,

    ),

  };



  return {

    ...DEFAULT_PROFIT_SCALING_ENGINE_CONFIGURATION,

    ...fileConfig,

    ...envConfig,

    ...overrides,

    neverExposeCredentials: true,

    neverExposeAuthenticationTokens: true,

    neverPrioritizeGrowthOverValidatedProfitability: true,

    preserveProfitTraceability: true,

    preserveAuditability: true,

    preserveFinancialIntegrity: true,

    structuralSignalsOnly: true,

    maskSensitiveValues: true,

    neverLogSensitiveFinancialInformation: true,

  };

}

