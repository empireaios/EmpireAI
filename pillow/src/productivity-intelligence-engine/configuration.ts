/** T5-04 — Externalized Productivity Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ProductivityIntelligenceConfiguration = {
  enabled: boolean;
  continuousLearningEnabled: boolean;
  learningFrequencyMs: number;
  patternDetectionRulesEnabled: boolean;
  bottleneckDetectionRulesEnabled: boolean;
  trendAnalysisRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  learningTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  maxHistoryLearningCycles: number;
  deduplicatePatterns: boolean;
  learnOnlyMode: boolean;
};

export const DEFAULT_PRODUCTIVITY_INTELLIGENCE_CONFIGURATION: ProductivityIntelligenceConfiguration =
  {
    enabled: true,
    continuousLearningEnabled: true,
    learningFrequencyMs: 10000,
    patternDetectionRulesEnabled: true,
    bottleneckDetectionRulesEnabled: true,
    trendAnalysisRulesEnabled: true,
    confidenceThreshold: 0.45,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    learningTimeoutMs: 60000,
    loggingLevel: "info",
    autoRecover: true,
    outputValidationEnabled: true,
    maxHistoryLearningCycles: 120,
    deduplicatePatterns: true,
    learnOnlyMode: true,
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

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadProductivityIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<ProductivityIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "productivity-intelligence.config.json"),
    join(repositoryRoot, "config", "productivity-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ProductivityIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildProductivityIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ProductivityIntelligenceConfiguration> = {},
): ProductivityIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadProductivityIntelligenceConfigFile(repositoryRoot)
    : null;

  const envConfig: Partial<ProductivityIntelligenceConfiguration> = {
    enabled: envBool(
      "PRODUCTIVITY_INTELLIGENCE_ENABLED",
      DEFAULT_PRODUCTIVITY_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    continuousLearningEnabled: envBool(
      "PRODUCTIVITY_INTELLIGENCE_CONTINUOUS",
      DEFAULT_PRODUCTIVITY_INTELLIGENCE_CONFIGURATION.continuousLearningEnabled,
    ),
    learningFrequencyMs: envInt(
      "PRODUCTIVITY_INTELLIGENCE_FREQUENCY_MS",
      DEFAULT_PRODUCTIVITY_INTELLIGENCE_CONFIGURATION.learningFrequencyMs,
    ),
    confidenceThreshold: envFloat(
      "PRODUCTIVITY_INTELLIGENCE_CONFIDENCE_THRESHOLD",
      DEFAULT_PRODUCTIVITY_INTELLIGENCE_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "PRODUCTIVITY_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_PRODUCTIVITY_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    learningTimeoutMs: envInt(
      "PRODUCTIVITY_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_PRODUCTIVITY_INTELLIGENCE_CONFIGURATION.learningTimeoutMs,
    ),
    loggingLevel: envString(
      "PRODUCTIVITY_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_PRODUCTIVITY_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as ProductivityIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PRODUCTIVITY_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_PRODUCTIVITY_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_PRODUCTIVITY_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    learnOnlyMode: true,
  };
}
