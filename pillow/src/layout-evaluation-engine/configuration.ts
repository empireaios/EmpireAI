/** T2-04 — Externalized Layout Evaluation configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EVALUATION_CATEGORIES } from "./paths.js";
import type { EvaluationCategory } from "./types.js";

export type LayoutEvaluationConfiguration = {
  enabled: boolean;
  evaluationFrequency: "on_demand" | "continuous" | "scheduled";
  evaluationCategories: EvaluationCategory[];
  ruleValidationEnabled: boolean;
  designSystemValidationEnabled: boolean;
  executivePreferenceValidationEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  evaluationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_LAYOUT_EVALUATION_CONFIGURATION: LayoutEvaluationConfiguration = {
  enabled: true,
  evaluationFrequency: "on_demand",
  evaluationCategories: [...EVALUATION_CATEGORIES],
  ruleValidationEnabled: true,
  designSystemValidationEnabled: true,
  executivePreferenceValidationEnabled: true,
  confidenceThreshold: 0.4,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  evaluationTimeoutMs: 60000,
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

export function loadLayoutEvaluationConfigFile(
  repositoryRoot: string,
): Partial<LayoutEvaluationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "layout-evaluation.config.json"),
    join(repositoryRoot, "config", "layout-evaluation.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<LayoutEvaluationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildLayoutEvaluationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LayoutEvaluationConfiguration> = {},
): LayoutEvaluationConfiguration {
  const fileConfig = repositoryRoot ? loadLayoutEvaluationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<LayoutEvaluationConfiguration> = {
    enabled: envBool(
      "LAYOUT_EVALUATION_ENABLED",
      DEFAULT_LAYOUT_EVALUATION_CONFIGURATION.enabled,
    ),
    confidenceThreshold: envFloat(
      "LAYOUT_EVALUATION_CONFIDENCE_THRESHOLD",
      DEFAULT_LAYOUT_EVALUATION_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "LAYOUT_EVALUATION_MAX_RETRIES",
      DEFAULT_LAYOUT_EVALUATION_CONFIGURATION.maxRetryAttempts,
    ),
    evaluationTimeoutMs: envInt(
      "LAYOUT_EVALUATION_TIMEOUT_MS",
      DEFAULT_LAYOUT_EVALUATION_CONFIGURATION.evaluationTimeoutMs,
    ),
    loggingLevel: envString(
      "LAYOUT_EVALUATION_LOG_LEVEL",
      DEFAULT_LAYOUT_EVALUATION_CONFIGURATION.loggingLevel,
    ) as LayoutEvaluationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "LAYOUT_EVALUATION_AUTO_RECOVER",
      DEFAULT_LAYOUT_EVALUATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_LAYOUT_EVALUATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
