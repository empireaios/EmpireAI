/** T2-08 — Externalized UX Scoring configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SCORING_CATEGORIES } from "./paths.js";
import type { ScoringCategory } from "./types.js";

export type CategoryWeight = {
  category: ScoringCategory;
  weight: number;
};

export type UxScoringConfiguration = {
  enabled: boolean;
  scoringFrequency: "on_demand" | "continuous" | "scheduled";
  scoreScale: { min: number; max: number };
  categoryWeights: CategoryWeight[];
  severityImpact: { error: number; warning: number; info: number };
  strengthBonus: number;
  confidenceImpactEnabled: boolean;
  minimumScoreThreshold: number;
  passThreshold: number;
  validationRulesEnabled: boolean;
  maxScoringDurationMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  scoringTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

const DEFAULT_WEIGHTS: CategoryWeight[] = [
  { category: "clarity", weight: 0.08 },
  { category: "visual_hierarchy", weight: 0.07 },
  { category: "layout_quality", weight: 0.1 },
  { category: "component_quality", weight: 0.1 },
  { category: "navigation_quality", weight: 0.08 },
  { category: "workflow_usability", weight: 0.1 },
  { category: "accessibility_quality", weight: 0.12 },
  { category: "visual_consistency", weight: 0.1 },
  { category: "design_system_alignment", weight: 0.07 },
  { category: "executive_preference_alignment", weight: 0.05 },
  { category: "form_usability", weight: 0.04 },
  { category: "dashboard_usability", weight: 0.03 },
  { category: "error_state_quality", weight: 0.03 },
  { category: "loading_state_quality", weight: 0.03 },
  { category: "empty_state_quality", weight: 0.03 },
  { category: "responsiveness", weight: 0.04 },
  { category: "governance_compliance", weight: 0.03 },
];

export const DEFAULT_UX_SCORING_CONFIGURATION: UxScoringConfiguration = {
  enabled: true,
  scoringFrequency: "on_demand",
  scoreScale: { min: 0, max: 100 },
  categoryWeights: DEFAULT_WEIGHTS,
  severityImpact: { error: 15, warning: 8, info: 3 },
  strengthBonus: 5,
  confidenceImpactEnabled: true,
  minimumScoreThreshold: 0,
  passThreshold: 70,
  validationRulesEnabled: true,
  maxScoringDurationMs: 60000,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  scoringTimeoutMs: 60000,
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

export function loadUxScoringConfigFile(
  repositoryRoot: string,
): Partial<UxScoringConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "ux-scoring.config.json"),
    join(repositoryRoot, "config", "ux-scoring.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<UxScoringConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildUxScoringConfiguration(
  repositoryRoot?: string,
  overrides: Partial<UxScoringConfiguration> = {},
): UxScoringConfiguration {
  const fileConfig = repositoryRoot ? loadUxScoringConfigFile(repositoryRoot) : null;
  const envConfig: Partial<UxScoringConfiguration> = {
    enabled: envBool("UX_SCORING_ENABLED", DEFAULT_UX_SCORING_CONFIGURATION.enabled),
    passThreshold: envInt(
      "UX_SCORING_PASS_THRESHOLD",
      DEFAULT_UX_SCORING_CONFIGURATION.passThreshold,
    ),
    maxRetryAttempts: envInt(
      "UX_SCORING_MAX_RETRIES",
      DEFAULT_UX_SCORING_CONFIGURATION.maxRetryAttempts,
    ),
    scoringTimeoutMs: envInt(
      "UX_SCORING_TIMEOUT_MS",
      DEFAULT_UX_SCORING_CONFIGURATION.scoringTimeoutMs,
    ),
    loggingLevel: envString(
      "UX_SCORING_LOG_LEVEL",
      DEFAULT_UX_SCORING_CONFIGURATION.loggingLevel,
    ) as UxScoringConfiguration["loggingLevel"],
    autoRecover: envBool(
      "UX_SCORING_AUTO_RECOVER",
      DEFAULT_UX_SCORING_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_UX_SCORING_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
