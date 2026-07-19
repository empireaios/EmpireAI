/** R5-17 — Externalized Marketing Experiment Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type MarketingExperimentEngineConfiguration = {
  enabled: boolean;
  experimentRulesEnabled: boolean;
  audienceAllocationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  healthMonitoringRulesEnabled: boolean;
  neverDeployWinningVariantsWithoutValidation: true;
  maskSensitiveValues: true;
  significanceThreshold: number;
  minimumSampleSize: number;
  defaultAudienceSplitPercent: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_MARKETING_EXPERIMENT_ENGINE_CONFIGURATION: MarketingExperimentEngineConfiguration =
  {
    enabled: true,
    experimentRulesEnabled: true,
    audienceAllocationRulesEnabled: true,
    validationRulesEnabled: true,
    healthMonitoringRulesEnabled: true,
    neverDeployWinningVariantsWithoutValidation: true,
    maskSensitiveValues: true,
    significanceThreshold: 0.95,
    minimumSampleSize: 100,
    defaultAudienceSplitPercent: 50,
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

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadMarketingExperimentEngineConfigFile(
  repositoryRoot: string,
): Partial<MarketingExperimentEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "marketing-experiment-engine.config.json"),
    join(repositoryRoot, "config", "marketing-experiment-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<MarketingExperimentEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildMarketingExperimentEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<MarketingExperimentEngineConfiguration> = {},
): MarketingExperimentEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadMarketingExperimentEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<MarketingExperimentEngineConfiguration> = {
    enabled: envBool(
      "MARKETING_EXPERIMENT_ENGINE_ENABLED",
      DEFAULT_MARKETING_EXPERIMENT_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "MARKETING_EXPERIMENT_ENGINE_TIMEOUT_MS",
      DEFAULT_MARKETING_EXPERIMENT_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "MARKETING_EXPERIMENT_ENGINE_MAX_RETRIES",
      DEFAULT_MARKETING_EXPERIMENT_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "MARKETING_EXPERIMENT_ENGINE_LOG_LEVEL",
      DEFAULT_MARKETING_EXPERIMENT_ENGINE_CONFIGURATION.loggingLevel,
    ) as MarketingExperimentEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "MARKETING_EXPERIMENT_ENGINE_AUTO_RECOVER",
      DEFAULT_MARKETING_EXPERIMENT_ENGINE_CONFIGURATION.autoRecover,
    ),
    significanceThreshold: envFloat(
      "MARKETING_EXPERIMENT_ENGINE_SIGNIFICANCE_THRESHOLD",
      DEFAULT_MARKETING_EXPERIMENT_ENGINE_CONFIGURATION.significanceThreshold,
    ),
    minimumSampleSize: envInt(
      "MARKETING_EXPERIMENT_ENGINE_MIN_SAMPLE_SIZE",
      DEFAULT_MARKETING_EXPERIMENT_ENGINE_CONFIGURATION.minimumSampleSize,
    ),
    defaultAudienceSplitPercent: envInt(
      "MARKETING_EXPERIMENT_ENGINE_AUDIENCE_SPLIT",
      DEFAULT_MARKETING_EXPERIMENT_ENGINE_CONFIGURATION.defaultAudienceSplitPercent,
    ),
  };

  return {
    ...DEFAULT_MARKETING_EXPERIMENT_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverDeployWinningVariantsWithoutValidation: true,
    maskSensitiveValues: true,
  };
}
