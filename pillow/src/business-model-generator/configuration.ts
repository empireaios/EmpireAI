/** X1-04 — Externalized Business Model Generator configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type BusinessModelGeneratorConfiguration = {
  enabled: boolean;
  revenueModelRulesEnabled: boolean;
  customerSegmentRulesEnabled: boolean;
  businessScoringRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverFabricateValidationResults: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  minBusinessModelScore: number;
  maxModelsPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_BUSINESS_MODEL_GENERATOR_CONFIGURATION: BusinessModelGeneratorConfiguration =
  {
    enabled: true,
    revenueModelRulesEnabled: true,
    customerSegmentRulesEnabled: true,
    businessScoringRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverFabricateValidationResults: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    minBusinessModelScore: 55,
    maxModelsPerCycle: 12,
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

export function loadBusinessModelGeneratorConfigFile(
  repositoryRoot: string,
): Partial<BusinessModelGeneratorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "business-model-generator.config.json"),
    join(repositoryRoot, "config", "business-model-generator.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<BusinessModelGeneratorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildBusinessModelGeneratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<BusinessModelGeneratorConfiguration> = {},
): BusinessModelGeneratorConfiguration {
  const fileConfig = repositoryRoot
    ? loadBusinessModelGeneratorConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<BusinessModelGeneratorConfiguration> = {
    enabled: envBool(
      "BUSINESS_MODEL_GENERATOR_ENABLED",
      DEFAULT_BUSINESS_MODEL_GENERATOR_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "BUSINESS_MODEL_GENERATOR_TIMEOUT_MS",
      DEFAULT_BUSINESS_MODEL_GENERATOR_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "BUSINESS_MODEL_GENERATOR_MAX_RETRIES",
      DEFAULT_BUSINESS_MODEL_GENERATOR_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "BUSINESS_MODEL_GENERATOR_LOG_LEVEL",
      DEFAULT_BUSINESS_MODEL_GENERATOR_CONFIGURATION.loggingLevel,
    ) as BusinessModelGeneratorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "BUSINESS_MODEL_GENERATOR_AUTO_RECOVER",
      DEFAULT_BUSINESS_MODEL_GENERATOR_CONFIGURATION.autoRecover,
    ),
    minBusinessModelScore: envInt(
      "BUSINESS_MODEL_GENERATOR_MIN_SCORE",
      DEFAULT_BUSINESS_MODEL_GENERATOR_CONFIGURATION.minBusinessModelScore,
    ),
    maxModelsPerCycle: envInt(
      "BUSINESS_MODEL_GENERATOR_MAX_MODELS",
      DEFAULT_BUSINESS_MODEL_GENERATOR_CONFIGURATION.maxModelsPerCycle,
    ),
  };

  return {
    ...DEFAULT_BUSINESS_MODEL_GENERATOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverFabricateValidationResults: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
