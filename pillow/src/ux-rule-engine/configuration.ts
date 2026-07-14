/** T2-01 — Externalized UX Rule Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  RULE_CATEGORIES,
  RULE_SEVERITIES,
  RULE_TARGET_TYPES,
} from "./paths.js";
import type { RuleCategory, RuleSeverity, RuleTargetType } from "./types.js";

export type UxRuleEngineConfiguration = {
  enabled: boolean;
  ruleSourceLocation: string;
  ruleCategories: RuleCategory[];
  ruleSeverityLevels: RuleSeverity[];
  ruleTargetTypes: RuleTargetType[];
  evaluationFrequency: "on_demand" | "manual";
  ruleVersioningEnabled: boolean;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  evaluationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  failOnCriticalViolations: boolean;
  allowPartialResults: boolean;
};

export const DEFAULT_UX_RULE_ENGINE_CONFIGURATION: UxRuleEngineConfiguration = {
  enabled: true,
  ruleSourceLocation: "config/ux-rules.json",
  ruleCategories: [...RULE_CATEGORIES],
  ruleSeverityLevels: [...RULE_SEVERITIES],
  ruleTargetTypes: [...RULE_TARGET_TYPES],
  evaluationFrequency: "on_demand",
  ruleVersioningEnabled: true,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  evaluationTimeoutMs: 60000,
  loggingLevel: "info",
  autoRecover: true,
  failOnCriticalViolations: true,
  allowPartialResults: true,
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

export function loadUxRuleEngineConfigFile(
  repositoryRoot: string,
): Partial<UxRuleEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "ux-rule-engine.config.json"),
    join(repositoryRoot, "config", "ux-rule-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<UxRuleEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildUxRuleEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<UxRuleEngineConfiguration> = {},
): UxRuleEngineConfiguration {
  const fileConfig = repositoryRoot ? loadUxRuleEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<UxRuleEngineConfiguration> = {
    enabled: envBool("UX_RULE_ENGINE_ENABLED", DEFAULT_UX_RULE_ENGINE_CONFIGURATION.enabled),
    ruleSourceLocation: envString(
      "UX_RULE_ENGINE_SOURCE",
      DEFAULT_UX_RULE_ENGINE_CONFIGURATION.ruleSourceLocation,
    ),
    maxRetryAttempts: envInt(
      "UX_RULE_ENGINE_MAX_RETRIES",
      DEFAULT_UX_RULE_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    evaluationTimeoutMs: envInt(
      "UX_RULE_ENGINE_TIMEOUT_MS",
      DEFAULT_UX_RULE_ENGINE_CONFIGURATION.evaluationTimeoutMs,
    ),
    loggingLevel: envString(
      "UX_RULE_ENGINE_LOG_LEVEL",
      DEFAULT_UX_RULE_ENGINE_CONFIGURATION.loggingLevel,
    ) as UxRuleEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "UX_RULE_ENGINE_AUTO_RECOVER",
      DEFAULT_UX_RULE_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_UX_RULE_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
