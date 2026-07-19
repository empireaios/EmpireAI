/** R2-19 — Externalized Procurement Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ProcurementIntelligenceConfiguration = {
  enabled: boolean;
  supplierEvaluationRulesEnabled: boolean;
  costOptimizationRulesEnabled: boolean;
  purchasingRecommendationRulesEnabled: boolean;
  confidenceThreshold: number;
  costOptimizationThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  requestTimeoutMs: number;
  healthMonitoringRulesEnabled: boolean;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preserveExistingOnValidationFailure: boolean;
  maskSensitiveValues: true;
};

export const DEFAULT_PROCUREMENT_INTELLIGENCE_CONFIGURATION: ProcurementIntelligenceConfiguration = {
  enabled: true,
  supplierEvaluationRulesEnabled: true,
  costOptimizationRulesEnabled: true,
  purchasingRecommendationRulesEnabled: true,
  confidenceThreshold: 60,
  costOptimizationThreshold: 10,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  requestTimeoutMs: 30000,
  healthMonitoringRulesEnabled: true,
  loggingLevel: "info",
  autoRecover: true,
  preserveExistingOnValidationFailure: true,
  maskSensitiveValues: true,
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

export function loadProcurementIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<ProcurementIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "procurement-intelligence.config.json"),
    join(repositoryRoot, "config", "procurement-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ProcurementIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildProcurementIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ProcurementIntelligenceConfiguration> = {},
): ProcurementIntelligenceConfiguration {
  const fileConfig = repositoryRoot ? loadProcurementIntelligenceConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ProcurementIntelligenceConfiguration> = {
    enabled: envBool(
      "PROCUREMENT_INTELLIGENCE_ENABLED",
      DEFAULT_PROCUREMENT_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    confidenceThreshold: envInt(
      "PROCUREMENT_INTELLIGENCE_CONFIDENCE_THRESHOLD",
      DEFAULT_PROCUREMENT_INTELLIGENCE_CONFIGURATION.confidenceThreshold,
    ),
    loggingLevel: envString(
      "PROCUREMENT_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_PROCUREMENT_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as ProcurementIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PROCUREMENT_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_PROCUREMENT_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PROCUREMENT_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
