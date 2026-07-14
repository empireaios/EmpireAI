/** T2-07 — Externalized Visual Consistency configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CONSISTENCY_CATEGORIES } from "./paths.js";
import type { ConsistencyCategory } from "./types.js";

export type VisualConsistencyConfiguration = {
  enabled: boolean;
  reviewFrequency: "on_demand" | "continuous" | "scheduled";
  reviewCategories: ConsistencyCategory[];
  componentConsistencyRulesEnabled: boolean;
  typographyConsistencyRulesEnabled: boolean;
  colorConsistencyRulesEnabled: boolean;
  spacingConsistencyRulesEnabled: boolean;
  sizingConsistencyRulesEnabled: boolean;
  iconConsistencyRulesEnabled: boolean;
  patternConsistencyRulesEnabled: boolean;
  severityRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  spacingTolerancePx: number;
  sizingTolerancePx: number;
  maxReviewDurationMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  reviewTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_VISUAL_CONSISTENCY_CONFIGURATION: VisualConsistencyConfiguration = {
  enabled: true,
  reviewFrequency: "on_demand",
  reviewCategories: [...CONSISTENCY_CATEGORIES],
  componentConsistencyRulesEnabled: true,
  typographyConsistencyRulesEnabled: true,
  colorConsistencyRulesEnabled: true,
  spacingConsistencyRulesEnabled: true,
  sizingConsistencyRulesEnabled: true,
  iconConsistencyRulesEnabled: true,
  patternConsistencyRulesEnabled: true,
  severityRulesEnabled: true,
  confidenceThreshold: 0.4,
  validationRulesEnabled: true,
  spacingTolerancePx: 4,
  sizingTolerancePx: 8,
  maxReviewDurationMs: 60000,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  reviewTimeoutMs: 60000,
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

export function loadVisualConsistencyConfigFile(
  repositoryRoot: string,
): Partial<VisualConsistencyConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "visual-consistency.config.json"),
    join(repositoryRoot, "config", "visual-consistency.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<VisualConsistencyConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildVisualConsistencyConfiguration(
  repositoryRoot?: string,
  overrides: Partial<VisualConsistencyConfiguration> = {},
): VisualConsistencyConfiguration {
  const fileConfig = repositoryRoot ? loadVisualConsistencyConfigFile(repositoryRoot) : null;
  const envConfig: Partial<VisualConsistencyConfiguration> = {
    enabled: envBool(
      "VISUAL_CONSISTENCY_ENABLED",
      DEFAULT_VISUAL_CONSISTENCY_CONFIGURATION.enabled,
    ),
    confidenceThreshold: envFloat(
      "VISUAL_CONSISTENCY_CONFIDENCE_THRESHOLD",
      DEFAULT_VISUAL_CONSISTENCY_CONFIGURATION.confidenceThreshold,
    ),
    spacingTolerancePx: envInt(
      "VISUAL_CONSISTENCY_SPACING_TOLERANCE_PX",
      DEFAULT_VISUAL_CONSISTENCY_CONFIGURATION.spacingTolerancePx,
    ),
    maxRetryAttempts: envInt(
      "VISUAL_CONSISTENCY_MAX_RETRIES",
      DEFAULT_VISUAL_CONSISTENCY_CONFIGURATION.maxRetryAttempts,
    ),
    reviewTimeoutMs: envInt(
      "VISUAL_CONSISTENCY_TIMEOUT_MS",
      DEFAULT_VISUAL_CONSISTENCY_CONFIGURATION.reviewTimeoutMs,
    ),
    loggingLevel: envString(
      "VISUAL_CONSISTENCY_LOG_LEVEL",
      DEFAULT_VISUAL_CONSISTENCY_CONFIGURATION.loggingLevel,
    ) as VisualConsistencyConfiguration["loggingLevel"],
    autoRecover: envBool(
      "VISUAL_CONSISTENCY_AUTO_RECOVER",
      DEFAULT_VISUAL_CONSISTENCY_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_VISUAL_CONSISTENCY_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
