/** T2-06 — Externalized Accessibility Intelligence configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ACCESSIBILITY_CATEGORIES } from "./paths.js";
import type { AccessibilityCategory } from "./types.js";

export type AccessibilityIntelligenceConfiguration = {
  enabled: boolean;
  reviewFrequency: "on_demand" | "continuous" | "scheduled";
  reviewCategories: AccessibilityCategory[];
  componentAccessibilityRulesEnabled: boolean;
  layoutAccessibilityRulesEnabled: boolean;
  navigationAccessibilityRulesEnabled: boolean;
  formAccessibilityRulesEnabled: boolean;
  focusOrderRulesEnabled: boolean;
  keyboardNavigationRulesEnabled: boolean;
  severityRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  minTouchTargetPx: number;
  maxReviewDurationMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  reviewTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_ACCESSIBILITY_INTELLIGENCE_CONFIGURATION: AccessibilityIntelligenceConfiguration =
  {
    enabled: true,
    reviewFrequency: "on_demand",
    reviewCategories: [...ACCESSIBILITY_CATEGORIES],
    componentAccessibilityRulesEnabled: true,
    layoutAccessibilityRulesEnabled: true,
    navigationAccessibilityRulesEnabled: true,
    formAccessibilityRulesEnabled: true,
    focusOrderRulesEnabled: true,
    keyboardNavigationRulesEnabled: true,
    severityRulesEnabled: true,
    confidenceThreshold: 0.4,
    validationRulesEnabled: true,
    minTouchTargetPx: 44,
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

export function loadAccessibilityIntelligenceConfigFile(
  repositoryRoot: string,
): Partial<AccessibilityIntelligenceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "accessibility-intelligence.config.json"),
    join(repositoryRoot, "config", "accessibility-intelligence.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<AccessibilityIntelligenceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAccessibilityIntelligenceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AccessibilityIntelligenceConfiguration> = {},
): AccessibilityIntelligenceConfiguration {
  const fileConfig = repositoryRoot
    ? loadAccessibilityIntelligenceConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<AccessibilityIntelligenceConfiguration> = {
    enabled: envBool(
      "ACCESSIBILITY_INTELLIGENCE_ENABLED",
      DEFAULT_ACCESSIBILITY_INTELLIGENCE_CONFIGURATION.enabled,
    ),
    confidenceThreshold: envFloat(
      "ACCESSIBILITY_INTELLIGENCE_CONFIDENCE_THRESHOLD",
      DEFAULT_ACCESSIBILITY_INTELLIGENCE_CONFIGURATION.confidenceThreshold,
    ),
    minTouchTargetPx: envInt(
      "ACCESSIBILITY_INTELLIGENCE_MIN_TOUCH_TARGET_PX",
      DEFAULT_ACCESSIBILITY_INTELLIGENCE_CONFIGURATION.minTouchTargetPx,
    ),
    maxRetryAttempts: envInt(
      "ACCESSIBILITY_INTELLIGENCE_MAX_RETRIES",
      DEFAULT_ACCESSIBILITY_INTELLIGENCE_CONFIGURATION.maxRetryAttempts,
    ),
    reviewTimeoutMs: envInt(
      "ACCESSIBILITY_INTELLIGENCE_TIMEOUT_MS",
      DEFAULT_ACCESSIBILITY_INTELLIGENCE_CONFIGURATION.reviewTimeoutMs,
    ),
    loggingLevel: envString(
      "ACCESSIBILITY_INTELLIGENCE_LOG_LEVEL",
      DEFAULT_ACCESSIBILITY_INTELLIGENCE_CONFIGURATION.loggingLevel,
    ) as AccessibilityIntelligenceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "ACCESSIBILITY_INTELLIGENCE_AUTO_RECOVER",
      DEFAULT_ACCESSIBILITY_INTELLIGENCE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_ACCESSIBILITY_INTELLIGENCE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
