/** T3-07 — Externalized Regression Protection configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  BASELINE_SOURCE_RULES,
  COMPARISON_SCOPES,
  REGRESSION_CATEGORIES,
} from "./paths.js";
import type {
  BaselineSourceRule,
  ComparisonScope,
  RegressionCategory,
} from "./types.js";

export type RegressionProtectionConfiguration = {
  enabled: boolean;
  baselineSourceRules: BaselineSourceRule[];
  comparisonScopes: ComparisonScope[];
  regressionCategories: RegressionCategory[];
  uxScoreRegressionThreshold: number;
  severityRulesEnabled: boolean;
  minConfidenceThreshold: number;
  blockOnCriticalRegressions: boolean;
  blockOnHighRegressions: boolean;
  layoutRegressionRulesEnabled: boolean;
  componentRegressionRulesEnabled: boolean;
  navigationRegressionRulesEnabled: boolean;
  accessibilityRegressionRulesEnabled: boolean;
  consistencyRegressionRulesEnabled: boolean;
  workflowRegressionRulesEnabled: boolean;
  responsiveRegressionRulesEnabled: boolean;
  stateRegressionRulesEnabled: boolean;
  maxReportsPerCheck: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  checkTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
};

export const DEFAULT_REGRESSION_PROTECTION_CONFIGURATION: RegressionProtectionConfiguration =
  {
    enabled: true,
    baselineSourceRules: [...BASELINE_SOURCE_RULES],
    comparisonScopes: [...COMPARISON_SCOPES],
    regressionCategories: [...REGRESSION_CATEGORIES],
    uxScoreRegressionThreshold: 5,
    severityRulesEnabled: true,
    minConfidenceThreshold: 0.4,
    blockOnCriticalRegressions: true,
    blockOnHighRegressions: true,
    layoutRegressionRulesEnabled: true,
    componentRegressionRulesEnabled: true,
    navigationRegressionRulesEnabled: true,
    accessibilityRegressionRulesEnabled: true,
    consistencyRegressionRulesEnabled: true,
    workflowRegressionRulesEnabled: true,
    responsiveRegressionRulesEnabled: true,
    stateRegressionRulesEnabled: true,
    maxReportsPerCheck: 20,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    checkTimeoutMs: 120000,
    loggingLevel: "info",
    autoRecover: true,
    outputValidationEnabled: true,
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

export function loadRegressionProtectionConfigFile(
  repositoryRoot: string,
): Partial<RegressionProtectionConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "regression-protection.config.json"),
    join(repositoryRoot, "config", "regression-protection.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<RegressionProtectionConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildRegressionProtectionConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RegressionProtectionConfiguration> = {},
): RegressionProtectionConfiguration {
  const fileConfig = repositoryRoot ? loadRegressionProtectionConfigFile(repositoryRoot) : null;
  const envConfig: Partial<RegressionProtectionConfiguration> = {
    enabled: envBool(
      "REGRESSION_PROTECTION_ENABLED",
      DEFAULT_REGRESSION_PROTECTION_CONFIGURATION.enabled,
    ),
    uxScoreRegressionThreshold: envFloat(
      "REGRESSION_PROTECTION_UX_THRESHOLD",
      DEFAULT_REGRESSION_PROTECTION_CONFIGURATION.uxScoreRegressionThreshold,
    ),
    minConfidenceThreshold: envFloat(
      "REGRESSION_PROTECTION_CONFIDENCE_THRESHOLD",
      DEFAULT_REGRESSION_PROTECTION_CONFIGURATION.minConfidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "REGRESSION_PROTECTION_MAX_RETRIES",
      DEFAULT_REGRESSION_PROTECTION_CONFIGURATION.maxRetryAttempts,
    ),
    checkTimeoutMs: envInt(
      "REGRESSION_PROTECTION_TIMEOUT_MS",
      DEFAULT_REGRESSION_PROTECTION_CONFIGURATION.checkTimeoutMs,
    ),
    loggingLevel: envString(
      "REGRESSION_PROTECTION_LOG_LEVEL",
      DEFAULT_REGRESSION_PROTECTION_CONFIGURATION.loggingLevel,
    ) as RegressionProtectionConfiguration["loggingLevel"],
    autoRecover: envBool(
      "REGRESSION_PROTECTION_AUTO_RECOVER",
      DEFAULT_REGRESSION_PROTECTION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_REGRESSION_PROTECTION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
