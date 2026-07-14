/** T3-02 — Externalized Component Generator configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { COMPONENT_CATEGORIES } from "./paths.js";
import type { ComponentCategory } from "./types.js";

export type ComponentGeneratorConfiguration = {
  enabled: boolean;
  allowedComponentCategories: ComponentCategory[];
  allowedTargetDirectories: string[];
  protectedFiles: string[];
  namingConvention: "PascalCase" | "kebab-case";
  propsRulesEnabled: boolean;
  variantRulesEnabled: boolean;
  stateRulesEnabled: boolean;
  stylingRulesEnabled: boolean;
  designSystemConstraintsEnabled: boolean;
  executivePreferenceConstraintsEnabled: boolean;
  safetyRulesEnabled: boolean;
  requireApprovalThreshold: boolean;
  minConfidenceThreshold: number;
  maxComponentsPerGeneration: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  generationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validationRulesEnabled: boolean;
  avoidDuplicateComponents: boolean;
};

export const DEFAULT_COMPONENT_GENERATOR_CONFIGURATION: ComponentGeneratorConfiguration = {
  enabled: true,
  allowedComponentCategories: [...COMPONENT_CATEGORIES],
  allowedTargetDirectories: [
    "empireai-web/components/generated",
    "empireai-web/components/platform/ui",
    "empireai-web/components/cockpit",
  ],
  protectedFiles: [
    "package.json",
    "tsconfig.json",
    "backend/",
    "pillow/src/session.ts",
    "pillow/src/index.ts",
  ],
  namingConvention: "PascalCase",
  propsRulesEnabled: true,
  variantRulesEnabled: true,
  stateRulesEnabled: true,
  stylingRulesEnabled: true,
  designSystemConstraintsEnabled: true,
  executivePreferenceConstraintsEnabled: true,
  safetyRulesEnabled: true,
  requireApprovalThreshold: true,
  minConfidenceThreshold: 0.4,
  maxComponentsPerGeneration: 20,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  generationTimeoutMs: 120000,
  loggingLevel: "info",
  autoRecover: true,
  validationRulesEnabled: true,
  avoidDuplicateComponents: true,
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

export function loadComponentGeneratorConfigFile(
  repositoryRoot: string,
): Partial<ComponentGeneratorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "component-generator.config.json"),
    join(repositoryRoot, "config", "component-generator.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ComponentGeneratorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildComponentGeneratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ComponentGeneratorConfiguration> = {},
): ComponentGeneratorConfiguration {
  const fileConfig = repositoryRoot ? loadComponentGeneratorConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ComponentGeneratorConfiguration> = {
    enabled: envBool(
      "COMPONENT_GENERATOR_ENABLED",
      DEFAULT_COMPONENT_GENERATOR_CONFIGURATION.enabled,
    ),
    minConfidenceThreshold: envFloat(
      "COMPONENT_GENERATOR_CONFIDENCE_THRESHOLD",
      DEFAULT_COMPONENT_GENERATOR_CONFIGURATION.minConfidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "COMPONENT_GENERATOR_MAX_RETRIES",
      DEFAULT_COMPONENT_GENERATOR_CONFIGURATION.maxRetryAttempts,
    ),
    generationTimeoutMs: envInt(
      "COMPONENT_GENERATOR_TIMEOUT_MS",
      DEFAULT_COMPONENT_GENERATOR_CONFIGURATION.generationTimeoutMs,
    ),
    loggingLevel: envString(
      "COMPONENT_GENERATOR_LOG_LEVEL",
      DEFAULT_COMPONENT_GENERATOR_CONFIGURATION.loggingLevel,
    ) as ComponentGeneratorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "COMPONENT_GENERATOR_AUTO_RECOVER",
      DEFAULT_COMPONENT_GENERATOR_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_COMPONENT_GENERATOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
