/** T2-03 — Externalized Executive Style Learning configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PREFERENCE_CATEGORIES } from "./paths.js";
import type { PreferenceCategory } from "./types.js";

export type ExecutiveStyleLearningConfiguration = {
  enabled: boolean;
  learningRules: string[];
  approvalWeight: number;
  rejectionWeight: number;
  confidenceThreshold: number;
  versioningEnabled: boolean;
  conflictResolutionEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  learningTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  preferenceCategories: PreferenceCategory[];
  deduplicateEvents: boolean;
};

export const DEFAULT_EXECUTIVE_STYLE_LEARNING_CONFIGURATION: ExecutiveStyleLearningConfiguration =
  {
    enabled: true,
    learningRules: ["explicit_approval", "explicit_rejection", "design_system_context"],
    approvalWeight: 0.15,
    rejectionWeight: 0.2,
    confidenceThreshold: 0.4,
    versioningEnabled: true,
    conflictResolutionEnabled: true,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    learningTimeoutMs: 60000,
    loggingLevel: "info",
    autoRecover: true,
    preferenceCategories: [...PREFERENCE_CATEGORIES],
    deduplicateEvents: true,
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

export function loadExecutiveStyleLearningConfigFile(
  repositoryRoot: string,
): Partial<ExecutiveStyleLearningConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "executive-style-learning.config.json"),
    join(repositoryRoot, "config", "executive-style-learning.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ExecutiveStyleLearningConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildExecutiveStyleLearningConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExecutiveStyleLearningConfiguration> = {},
): ExecutiveStyleLearningConfiguration {
  const fileConfig = repositoryRoot
    ? loadExecutiveStyleLearningConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<ExecutiveStyleLearningConfiguration> = {
    enabled: envBool(
      "EXECUTIVE_STYLE_LEARNING_ENABLED",
      DEFAULT_EXECUTIVE_STYLE_LEARNING_CONFIGURATION.enabled,
    ),
    approvalWeight: envFloat(
      "EXECUTIVE_STYLE_LEARNING_APPROVAL_WEIGHT",
      DEFAULT_EXECUTIVE_STYLE_LEARNING_CONFIGURATION.approvalWeight,
    ),
    rejectionWeight: envFloat(
      "EXECUTIVE_STYLE_LEARNING_REJECTION_WEIGHT",
      DEFAULT_EXECUTIVE_STYLE_LEARNING_CONFIGURATION.rejectionWeight,
    ),
    confidenceThreshold: envFloat(
      "EXECUTIVE_STYLE_LEARNING_CONFIDENCE_THRESHOLD",
      DEFAULT_EXECUTIVE_STYLE_LEARNING_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "EXECUTIVE_STYLE_LEARNING_MAX_RETRIES",
      DEFAULT_EXECUTIVE_STYLE_LEARNING_CONFIGURATION.maxRetryAttempts,
    ),
    learningTimeoutMs: envInt(
      "EXECUTIVE_STYLE_LEARNING_TIMEOUT_MS",
      DEFAULT_EXECUTIVE_STYLE_LEARNING_CONFIGURATION.learningTimeoutMs,
    ),
    loggingLevel: envString(
      "EXECUTIVE_STYLE_LEARNING_LOG_LEVEL",
      DEFAULT_EXECUTIVE_STYLE_LEARNING_CONFIGURATION.loggingLevel,
    ) as ExecutiveStyleLearningConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EXECUTIVE_STYLE_LEARNING_AUTO_RECOVER",
      DEFAULT_EXECUTIVE_STYLE_LEARNING_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_EXECUTIVE_STYLE_LEARNING_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
