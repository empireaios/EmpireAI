/** T3-04 — Externalized Theme Builder configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { THEME_SCOPES } from "./paths.js";
import type { ThemeScope } from "./types.js";

export type ThemeBuilderConfiguration = {
  enabled: boolean;
  allowedThemeScopes: ThemeScope[];
  allowedTargetDirectories: string[];
  protectedFiles: string[];
  tokenNamingRulesEnabled: boolean;
  colorRulesEnabled: boolean;
  typographyRulesEnabled: boolean;
  spacingRulesEnabled: boolean;
  sizingRulesEnabled: boolean;
  borderRulesEnabled: boolean;
  radiusRulesEnabled: boolean;
  shadowRulesEnabled: boolean;
  interactionStateRulesEnabled: boolean;
  designSystemConstraintsEnabled: boolean;
  executivePreferenceConstraintsEnabled: boolean;
  safetyRulesEnabled: boolean;
  requireApprovalThreshold: boolean;
  minConfidenceThreshold: number;
  maxThemesPerGeneration: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  generationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validationRulesEnabled: boolean;
};

export const DEFAULT_THEME_BUILDER_CONFIGURATION: ThemeBuilderConfiguration = {
  enabled: true,
  allowedThemeScopes: [...THEME_SCOPES],
  allowedTargetDirectories: [
    "empireai-web/styles/themes",
    "empireai-web/components/generated",
    "empireai-web/app",
  ],
  protectedFiles: [
    "package.json",
    "tsconfig.json",
    "backend/",
    "pillow/src/session.ts",
    "pillow/src/index.ts",
  ],
  tokenNamingRulesEnabled: true,
  colorRulesEnabled: true,
  typographyRulesEnabled: true,
  spacingRulesEnabled: true,
  sizingRulesEnabled: true,
  borderRulesEnabled: true,
  radiusRulesEnabled: true,
  shadowRulesEnabled: true,
  interactionStateRulesEnabled: true,
  designSystemConstraintsEnabled: true,
  executivePreferenceConstraintsEnabled: true,
  safetyRulesEnabled: true,
  requireApprovalThreshold: true,
  minConfidenceThreshold: 0.4,
  maxThemesPerGeneration: 20,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  generationTimeoutMs: 120000,
  loggingLevel: "info",
  autoRecover: true,
  validationRulesEnabled: true,
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

export function loadThemeBuilderConfigFile(
  repositoryRoot: string,
): Partial<ThemeBuilderConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "theme-builder.config.json"),
    join(repositoryRoot, "config", "theme-builder.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ThemeBuilderConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildThemeBuilderConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ThemeBuilderConfiguration> = {},
): ThemeBuilderConfiguration {
  const fileConfig = repositoryRoot ? loadThemeBuilderConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ThemeBuilderConfiguration> = {
    enabled: envBool("THEME_BUILDER_ENABLED", DEFAULT_THEME_BUILDER_CONFIGURATION.enabled),
    minConfidenceThreshold: envFloat(
      "THEME_BUILDER_CONFIDENCE_THRESHOLD",
      DEFAULT_THEME_BUILDER_CONFIGURATION.minConfidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "THEME_BUILDER_MAX_RETRIES",
      DEFAULT_THEME_BUILDER_CONFIGURATION.maxRetryAttempts,
    ),
    generationTimeoutMs: envInt(
      "THEME_BUILDER_TIMEOUT_MS",
      DEFAULT_THEME_BUILDER_CONFIGURATION.generationTimeoutMs,
    ),
    loggingLevel: envString(
      "THEME_BUILDER_LOG_LEVEL",
      DEFAULT_THEME_BUILDER_CONFIGURATION.loggingLevel,
    ) as ThemeBuilderConfiguration["loggingLevel"],
    autoRecover: envBool(
      "THEME_BUILDER_AUTO_RECOVER",
      DEFAULT_THEME_BUILDER_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_THEME_BUILDER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
