/** T4-06 — Externalized Explain Decisions configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { EXPLANATION_DETAIL_LEVELS, EXPLANATION_TYPES } from "./paths.js";
import type { ExplanationDetailLevel, ExplanationType } from "./types.js";

export type ExplainDecisionsConfiguration = {
  enabled: boolean;
  explanationDetailLevel: ExplanationDetailLevel;
  evidenceLinkageRulesEnabled: boolean;
  tradeoffAnalysisRulesEnabled: boolean;
  uxScoreExplanationRulesEnabled: boolean;
  accessibilityExplanationRulesEnabled: boolean;
  consistencyExplanationRulesEnabled: boolean;
  workflowExplanationRulesEnabled: boolean;
  executivePreferenceExplanationRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  explanationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  supportedExplanationTypes: ExplanationType[];
  outputValidationEnabled: boolean;
  maxHistoryExplanations: number;
  weakEvidenceWarningEnabled: boolean;
};

export const DEFAULT_EXPLAIN_DECISIONS_CONFIGURATION: ExplainDecisionsConfiguration = {
  enabled: true,
  explanationDetailLevel: "standard",
  evidenceLinkageRulesEnabled: true,
  tradeoffAnalysisRulesEnabled: true,
  uxScoreExplanationRulesEnabled: true,
  accessibilityExplanationRulesEnabled: true,
  consistencyExplanationRulesEnabled: true,
  workflowExplanationRulesEnabled: true,
  executivePreferenceExplanationRulesEnabled: true,
  confidenceThreshold: 0.45,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  explanationTimeoutMs: 120000,
  loggingLevel: "info",
  autoRecover: true,
  supportedExplanationTypes: [...EXPLANATION_TYPES],
  outputValidationEnabled: true,
  maxHistoryExplanations: 50,
  weakEvidenceWarningEnabled: true,
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

export function loadExplainDecisionsConfigFile(
  repositoryRoot: string,
): Partial<ExplainDecisionsConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "explain-decisions.config.json"),
    join(repositoryRoot, "config", "explain-decisions.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ExplainDecisionsConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildExplainDecisionsConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExplainDecisionsConfiguration> = {},
): ExplainDecisionsConfiguration {
  const fileConfig = repositoryRoot ? loadExplainDecisionsConfigFile(repositoryRoot) : null;

  const envConfig: Partial<ExplainDecisionsConfiguration> = {
    enabled: envBool("EXPLAIN_DECISIONS_ENABLED", DEFAULT_EXPLAIN_DECISIONS_CONFIGURATION.enabled),
    explanationDetailLevel: envString(
      "EXPLAIN_DECISIONS_DETAIL_LEVEL",
      DEFAULT_EXPLAIN_DECISIONS_CONFIGURATION.explanationDetailLevel,
    ) as ExplanationDetailLevel,
    confidenceThreshold: envFloat(
      "EXPLAIN_DECISIONS_CONFIDENCE_THRESHOLD",
      DEFAULT_EXPLAIN_DECISIONS_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "EXPLAIN_DECISIONS_MAX_RETRIES",
      DEFAULT_EXPLAIN_DECISIONS_CONFIGURATION.maxRetryAttempts,
    ),
    explanationTimeoutMs: envInt(
      "EXPLAIN_DECISIONS_TIMEOUT_MS",
      DEFAULT_EXPLAIN_DECISIONS_CONFIGURATION.explanationTimeoutMs,
    ),
    loggingLevel: envString(
      "EXPLAIN_DECISIONS_LOG_LEVEL",
      DEFAULT_EXPLAIN_DECISIONS_CONFIGURATION.loggingLevel,
    ) as ExplainDecisionsConfiguration["loggingLevel"],
    autoRecover: envBool(
      "EXPLAIN_DECISIONS_AUTO_RECOVER",
      DEFAULT_EXPLAIN_DECISIONS_CONFIGURATION.autoRecover,
    ),
  };

  const detailLevel = envConfig.explanationDetailLevel ?? fileConfig?.explanationDetailLevel;
  if (detailLevel && !EXPLANATION_DETAIL_LEVELS.includes(detailLevel)) {
    envConfig.explanationDetailLevel = "standard";
  }

  return {
    ...DEFAULT_EXPLAIN_DECISIONS_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
