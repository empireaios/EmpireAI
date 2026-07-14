/** T5-09 — Externalized Self-Improving UX configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SelfImprovingUxConfiguration = {
  enabled: boolean;
  continuousLearningEnabled: boolean;
  learningFrequencyMs: number;
  learningRulesEnabled: boolean;
  knowledgeRetentionRulesEnabled: boolean;
  recommendationImprovementRulesEnabled: boolean;
  prioritizationImprovementRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  learningTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  maxKnowledgeBaseEntries: number;
  deduplicateLearnings: boolean;
  learnOnlyMode: boolean;
};

export const DEFAULT_SELF_IMPROVING_UX_CONFIGURATION: SelfImprovingUxConfiguration = {
  enabled: true,
  continuousLearningEnabled: true,
  learningFrequencyMs: 22000,
  learningRulesEnabled: true,
  knowledgeRetentionRulesEnabled: true,
  recommendationImprovementRulesEnabled: true,
  prioritizationImprovementRulesEnabled: true,
  confidenceThreshold: 0.45,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  learningTimeoutMs: 60000,
  loggingLevel: "info",
  autoRecover: true,
  outputValidationEnabled: true,
  maxKnowledgeBaseEntries: 200,
  deduplicateLearnings: true,
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

export function loadSelfImprovingUxConfigFile(
  repositoryRoot: string,
): Partial<SelfImprovingUxConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "self-improving-ux.config.json"),
    join(repositoryRoot, "config", "self-improving-ux.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<SelfImprovingUxConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSelfImprovingUxConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SelfImprovingUxConfiguration> = {},
): SelfImprovingUxConfiguration {
  const fileConfig = repositoryRoot ? loadSelfImprovingUxConfigFile(repositoryRoot) : null;

  const envConfig: Partial<SelfImprovingUxConfiguration> = {
    enabled: envBool(
      "SELF_IMPROVING_UX_ENABLED",
      DEFAULT_SELF_IMPROVING_UX_CONFIGURATION.enabled,
    ),
    continuousLearningEnabled: envBool(
      "SELF_IMPROVING_UX_CONTINUOUS",
      DEFAULT_SELF_IMPROVING_UX_CONFIGURATION.continuousLearningEnabled,
    ),
    learningFrequencyMs: envInt(
      "SELF_IMPROVING_UX_FREQUENCY_MS",
      DEFAULT_SELF_IMPROVING_UX_CONFIGURATION.learningFrequencyMs,
    ),
    confidenceThreshold: envFloat(
      "SELF_IMPROVING_UX_CONFIDENCE_THRESHOLD",
      DEFAULT_SELF_IMPROVING_UX_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "SELF_IMPROVING_UX_MAX_RETRIES",
      DEFAULT_SELF_IMPROVING_UX_CONFIGURATION.maxRetryAttempts,
    ),
    learningTimeoutMs: envInt(
      "SELF_IMPROVING_UX_TIMEOUT_MS",
      DEFAULT_SELF_IMPROVING_UX_CONFIGURATION.learningTimeoutMs,
    ),
    loggingLevel: envString(
      "SELF_IMPROVING_UX_LOG_LEVEL",
      DEFAULT_SELF_IMPROVING_UX_CONFIGURATION.loggingLevel,
    ) as SelfImprovingUxConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SELF_IMPROVING_UX_AUTO_RECOVER",
      DEFAULT_SELF_IMPROVING_UX_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SELF_IMPROVING_UX_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    learnOnlyMode: true,
  };
}
