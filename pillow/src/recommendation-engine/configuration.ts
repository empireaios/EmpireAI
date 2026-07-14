/** T2-09 — Externalized Recommendation Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { RECOMMENDATION_CATEGORIES } from "./paths.js";
import type { RecommendationCategory } from "./types.js";

export type RecommendationEngineConfiguration = {
  enabled: boolean;
  recommendationFrequency: "on_demand" | "continuous" | "scheduled";
  recommendationCategories: RecommendationCategory[];
  priorityRulesEnabled: boolean;
  severityRulesEnabled: boolean;
  confidenceThreshold: number;
  evidenceRequirementsEnabled: boolean;
  maxProposalsPerReport: number;
  validationRulesEnabled: boolean;
  maxReportDurationMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  reportTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_RECOMMENDATION_ENGINE_CONFIGURATION: RecommendationEngineConfiguration = {
  enabled: true,
  recommendationFrequency: "on_demand",
  recommendationCategories: [...RECOMMENDATION_CATEGORIES],
  priorityRulesEnabled: true,
  severityRulesEnabled: true,
  confidenceThreshold: 0.4,
  evidenceRequirementsEnabled: true,
  maxProposalsPerReport: 50,
  validationRulesEnabled: true,
  maxReportDurationMs: 60000,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  reportTimeoutMs: 60000,
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

export function loadRecommendationEngineConfigFile(
  repositoryRoot: string,
): Partial<RecommendationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "recommendation-engine.config.json"),
    join(repositoryRoot, "config", "recommendation-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<RecommendationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildRecommendationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RecommendationEngineConfiguration> = {},
): RecommendationEngineConfiguration {
  const fileConfig = repositoryRoot ? loadRecommendationEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<RecommendationEngineConfiguration> = {
    enabled: envBool(
      "RECOMMENDATION_ENGINE_ENABLED",
      DEFAULT_RECOMMENDATION_ENGINE_CONFIGURATION.enabled,
    ),
    confidenceThreshold: envFloat(
      "RECOMMENDATION_ENGINE_CONFIDENCE_THRESHOLD",
      DEFAULT_RECOMMENDATION_ENGINE_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "RECOMMENDATION_ENGINE_MAX_RETRIES",
      DEFAULT_RECOMMENDATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    reportTimeoutMs: envInt(
      "RECOMMENDATION_ENGINE_TIMEOUT_MS",
      DEFAULT_RECOMMENDATION_ENGINE_CONFIGURATION.reportTimeoutMs,
    ),
    loggingLevel: envString(
      "RECOMMENDATION_ENGINE_LOG_LEVEL",
      DEFAULT_RECOMMENDATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as RecommendationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "RECOMMENDATION_ENGINE_AUTO_RECOVER",
      DEFAULT_RECOMMENDATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_RECOMMENDATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
