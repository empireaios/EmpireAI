/** T3-06 — Externalized Validation Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DEFECT_CATEGORIES, VALIDATION_SCOPES } from "./paths.js";
import type { DefectCategory, ValidationScope } from "./types.js";

export type ValidationEngineConfiguration = {
  enabled: boolean;
  validationScopes: ValidationScope[];
  validationFrequency: "on_demand" | "per_preview" | "continuous";
  defectCategories: DefectCategory[];
  severityRulesEnabled: boolean;
  minConfidenceThreshold: number;
  blockOnCriticalDefects: boolean;
  blockOnHighDefects: boolean;
  previewValidationRulesEnabled: boolean;
  componentValidationRulesEnabled: boolean;
  layoutValidationRulesEnabled: boolean;
  themeValidationRulesEnabled: boolean;
  responsiveValidationRulesEnabled: boolean;
  stateValidationRulesEnabled: boolean;
  maxReportsPerValidation: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  validationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
};

export const DEFAULT_VALIDATION_ENGINE_CONFIGURATION: ValidationEngineConfiguration = {
  enabled: true,
  validationScopes: [...VALIDATION_SCOPES],
  validationFrequency: "per_preview",
  defectCategories: [...DEFECT_CATEGORIES],
  severityRulesEnabled: true,
  minConfidenceThreshold: 0.4,
  blockOnCriticalDefects: true,
  blockOnHighDefects: true,
  previewValidationRulesEnabled: true,
  componentValidationRulesEnabled: true,
  layoutValidationRulesEnabled: true,
  themeValidationRulesEnabled: true,
  responsiveValidationRulesEnabled: true,
  stateValidationRulesEnabled: true,
  maxReportsPerValidation: 20,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  validationTimeoutMs: 120000,
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

export function loadValidationEngineConfigFile(
  repositoryRoot: string,
): Partial<ValidationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "validation-engine.config.json"),
    join(repositoryRoot, "config", "validation-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ValidationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildValidationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ValidationEngineConfiguration> = {},
): ValidationEngineConfiguration {
  const fileConfig = repositoryRoot ? loadValidationEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ValidationEngineConfiguration> = {
    enabled: envBool("VALIDATION_ENGINE_ENABLED", DEFAULT_VALIDATION_ENGINE_CONFIGURATION.enabled),
    minConfidenceThreshold: envFloat(
      "VALIDATION_ENGINE_CONFIDENCE_THRESHOLD",
      DEFAULT_VALIDATION_ENGINE_CONFIGURATION.minConfidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "VALIDATION_ENGINE_MAX_RETRIES",
      DEFAULT_VALIDATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    validationTimeoutMs: envInt(
      "VALIDATION_ENGINE_TIMEOUT_MS",
      DEFAULT_VALIDATION_ENGINE_CONFIGURATION.validationTimeoutMs,
    ),
    loggingLevel: envString(
      "VALIDATION_ENGINE_LOG_LEVEL",
      DEFAULT_VALIDATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as ValidationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "VALIDATION_ENGINE_AUTO_RECOVER",
      DEFAULT_VALIDATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_VALIDATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
