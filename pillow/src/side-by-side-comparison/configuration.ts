/** T4-05 — Externalized Side-by-Side Comparison configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { COMPARISON_TYPES } from "./paths.js";
import type { ComparisonType } from "./types.js";

export type SideBySideComparisonConfiguration = {
  enabled: boolean;
  maximumComparedOptions: number;
  comparisonLayoutRulesEnabled: boolean;
  differenceHighlightRulesEnabled: boolean;
  previewLinkageRulesEnabled: boolean;
  uxScoreDisplayRulesEnabled: boolean;
  accessibilityDisplayRulesEnabled: boolean;
  consistencyDisplayRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  comparisonTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  supportedComparisonTypes: ComparisonType[];
  outputValidationEnabled: boolean;
  maxHistoryComparisons: number;
};

export const DEFAULT_SIDE_BY_SIDE_COMPARISON_CONFIGURATION: SideBySideComparisonConfiguration =
  {
    enabled: true,
    maximumComparedOptions: 4,
    comparisonLayoutRulesEnabled: true,
    differenceHighlightRulesEnabled: true,
    previewLinkageRulesEnabled: true,
    uxScoreDisplayRulesEnabled: true,
    accessibilityDisplayRulesEnabled: true,
    consistencyDisplayRulesEnabled: true,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    comparisonTimeoutMs: 120000,
    loggingLevel: "info",
    autoRecover: true,
    supportedComparisonTypes: [...COMPARISON_TYPES],
    outputValidationEnabled: true,
    maxHistoryComparisons: 50,
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

export function loadSideBySideComparisonConfigFile(
  repositoryRoot: string,
): Partial<SideBySideComparisonConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "side-by-side-comparison.config.json"),
    join(repositoryRoot, "config", "side-by-side-comparison.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<SideBySideComparisonConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSideBySideComparisonConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SideBySideComparisonConfiguration> = {},
): SideBySideComparisonConfiguration {
  const fileConfig = repositoryRoot
    ? loadSideBySideComparisonConfigFile(repositoryRoot)
    : null;

  const envConfig: Partial<SideBySideComparisonConfiguration> = {
    enabled: envBool(
      "SIDE_BY_SIDE_COMPARISON_ENABLED",
      DEFAULT_SIDE_BY_SIDE_COMPARISON_CONFIGURATION.enabled,
    ),
    maximumComparedOptions: envInt(
      "SIDE_BY_SIDE_COMPARISON_MAX_OPTIONS",
      DEFAULT_SIDE_BY_SIDE_COMPARISON_CONFIGURATION.maximumComparedOptions,
    ),
    maxRetryAttempts: envInt(
      "SIDE_BY_SIDE_COMPARISON_MAX_RETRIES",
      DEFAULT_SIDE_BY_SIDE_COMPARISON_CONFIGURATION.maxRetryAttempts,
    ),
    comparisonTimeoutMs: envInt(
      "SIDE_BY_SIDE_COMPARISON_TIMEOUT_MS",
      DEFAULT_SIDE_BY_SIDE_COMPARISON_CONFIGURATION.comparisonTimeoutMs,
    ),
    loggingLevel: envString(
      "SIDE_BY_SIDE_COMPARISON_LOG_LEVEL",
      DEFAULT_SIDE_BY_SIDE_COMPARISON_CONFIGURATION.loggingLevel,
    ) as SideBySideComparisonConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SIDE_BY_SIDE_COMPARISON_AUTO_RECOVER",
      DEFAULT_SIDE_BY_SIDE_COMPARISON_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SIDE_BY_SIDE_COMPARISON_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
