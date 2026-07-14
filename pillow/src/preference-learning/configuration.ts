/** T4-08 — Externalized Preference Learning configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LEARNING_SCOPES, PREFERENCE_CATEGORIES } from "./paths.js";
import type { LearningScope, PreferenceCategory } from "./types.js";

export type PreferenceLearningConfiguration = {
  enabled: boolean;
  learningScope: LearningScope;
  evidenceRequirementsEnabled: boolean;
  confidenceThreshold: number;
  versioningRulesEnabled: boolean;
  preferenceRetentionRulesEnabled: boolean;
  explicitEvidenceRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  learningTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  supportedCategories: PreferenceCategory[];
  outputValidationEnabled: boolean;
  maxHistoryPreferences: number;
  maxPreferenceVersions: number;
};

export const DEFAULT_PREFERENCE_LEARNING_CONFIGURATION: PreferenceLearningConfiguration = {
  enabled: true,
  learningScope: "standard",
  evidenceRequirementsEnabled: true,
  confidenceThreshold: 0.45,
  versioningRulesEnabled: true,
  preferenceRetentionRulesEnabled: true,
  explicitEvidenceRulesEnabled: true,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  learningTimeoutMs: 120000,
  loggingLevel: "info",
  autoRecover: true,
  supportedCategories: [...PREFERENCE_CATEGORIES],
  outputValidationEnabled: true,
  maxHistoryPreferences: 100,
  maxPreferenceVersions: 20,
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

function envFloat(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}

export function loadPreferenceLearningConfigFile(
  repositoryRoot: string,
): Partial<PreferenceLearningConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "preference-learning.config.json"),
    join(repositoryRoot, "config", "preference-learning.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<PreferenceLearningConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPreferenceLearningConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PreferenceLearningConfiguration> = {},
): PreferenceLearningConfiguration {
  const fileConfig = repositoryRoot ? loadPreferenceLearningConfigFile(repositoryRoot) : null;

  const envConfig: Partial<PreferenceLearningConfiguration> = {
    enabled: envBool("PREFERENCE_LEARNING_ENABLED", DEFAULT_PREFERENCE_LEARNING_CONFIGURATION.enabled),
    learningScope: envString(
      "PREFERENCE_LEARNING_SCOPE",
      DEFAULT_PREFERENCE_LEARNING_CONFIGURATION.learningScope,
    ) as LearningScope,
    confidenceThreshold: envFloat(
      "PREFERENCE_LEARNING_CONFIDENCE_THRESHOLD",
      DEFAULT_PREFERENCE_LEARNING_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "PREFERENCE_LEARNING_MAX_RETRIES",
      DEFAULT_PREFERENCE_LEARNING_CONFIGURATION.maxRetryAttempts,
    ),
    learningTimeoutMs: envInt(
      "PREFERENCE_LEARNING_TIMEOUT_MS",
      DEFAULT_PREFERENCE_LEARNING_CONFIGURATION.learningTimeoutMs,
    ),
    loggingLevel: envString(
      "PREFERENCE_LEARNING_LOG_LEVEL",
      DEFAULT_PREFERENCE_LEARNING_CONFIGURATION.loggingLevel,
    ) as PreferenceLearningConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PREFERENCE_LEARNING_AUTO_RECOVER",
      DEFAULT_PREFERENCE_LEARNING_CONFIGURATION.autoRecover,
    ),
  };

  const scope = envConfig.learningScope ?? fileConfig?.learningScope;
  if (scope && !LEARNING_SCOPES.includes(scope)) {
    envConfig.learningScope = "standard";
  }

  return {
    ...DEFAULT_PREFERENCE_LEARNING_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
