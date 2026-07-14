/** T5-07 — Externalized Continuous UX Evolution configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ContinuousUxEvolutionConfiguration = {
  enabled: boolean;
  continuousEvolutionEnabled: boolean;
  evolutionFrequencyMs: number;
  improvementPrioritizationRulesEnabled: boolean;
  trendAnalysisRulesEnabled: boolean;
  recommendationRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  evolutionTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  maxHistoryEvolutionCycles: number;
  deduplicateImprovements: boolean;
  recommendOnlyMode: boolean;
};

export const DEFAULT_CONTINUOUS_UX_EVOLUTION_CONFIGURATION: ContinuousUxEvolutionConfiguration =
  {
    enabled: true,
    continuousEvolutionEnabled: true,
    evolutionFrequencyMs: 18000,
    improvementPrioritizationRulesEnabled: true,
    trendAnalysisRulesEnabled: true,
    recommendationRulesEnabled: true,
    confidenceThreshold: 0.45,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    evolutionTimeoutMs: 60000,
    loggingLevel: "info",
    autoRecover: true,
    outputValidationEnabled: true,
    maxHistoryEvolutionCycles: 120,
    deduplicateImprovements: true,
    recommendOnlyMode: true,
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

export function loadContinuousUxEvolutionConfigFile(
  repositoryRoot: string,
): Partial<ContinuousUxEvolutionConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "continuous-ux-evolution.config.json"),
    join(repositoryRoot, "config", "continuous-ux-evolution.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ContinuousUxEvolutionConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildContinuousUxEvolutionConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ContinuousUxEvolutionConfiguration> = {},
): ContinuousUxEvolutionConfiguration {
  const fileConfig = repositoryRoot
    ? loadContinuousUxEvolutionConfigFile(repositoryRoot)
    : null;

  const envConfig: Partial<ContinuousUxEvolutionConfiguration> = {
    enabled: envBool(
      "CONTINUOUS_UX_EVOLUTION_ENABLED",
      DEFAULT_CONTINUOUS_UX_EVOLUTION_CONFIGURATION.enabled,
    ),
    continuousEvolutionEnabled: envBool(
      "CONTINUOUS_UX_EVOLUTION_CONTINUOUS",
      DEFAULT_CONTINUOUS_UX_EVOLUTION_CONFIGURATION.continuousEvolutionEnabled,
    ),
    evolutionFrequencyMs: envInt(
      "CONTINUOUS_UX_EVOLUTION_FREQUENCY_MS",
      DEFAULT_CONTINUOUS_UX_EVOLUTION_CONFIGURATION.evolutionFrequencyMs,
    ),
    confidenceThreshold: envFloat(
      "CONTINUOUS_UX_EVOLUTION_CONFIDENCE_THRESHOLD",
      DEFAULT_CONTINUOUS_UX_EVOLUTION_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "CONTINUOUS_UX_EVOLUTION_MAX_RETRIES",
      DEFAULT_CONTINUOUS_UX_EVOLUTION_CONFIGURATION.maxRetryAttempts,
    ),
    evolutionTimeoutMs: envInt(
      "CONTINUOUS_UX_EVOLUTION_TIMEOUT_MS",
      DEFAULT_CONTINUOUS_UX_EVOLUTION_CONFIGURATION.evolutionTimeoutMs,
    ),
    loggingLevel: envString(
      "CONTINUOUS_UX_EVOLUTION_LOG_LEVEL",
      DEFAULT_CONTINUOUS_UX_EVOLUTION_CONFIGURATION.loggingLevel,
    ) as ContinuousUxEvolutionConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CONTINUOUS_UX_EVOLUTION_AUTO_RECOVER",
      DEFAULT_CONTINUOUS_UX_EVOLUTION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CONTINUOUS_UX_EVOLUTION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    recommendOnlyMode: true,
  };
}
