/** T3-03 — Externalized Layout Refactoring configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { LAYOUT_SCOPES } from "./paths.js";
import type { LayoutScope } from "./types.js";

export type LayoutRefactoringConfiguration = {
  enabled: boolean;
  allowedLayoutScopes: LayoutScope[];
  allowedTargetDirectories: string[];
  protectedFiles: string[];
  responsiveBreakpointRules: string[];
  spacingRules: string[];
  alignmentRules: string[];
  componentPlacementRulesEnabled: boolean;
  designSystemConstraintsEnabled: boolean;
  executivePreferenceConstraintsEnabled: boolean;
  safetyRulesEnabled: boolean;
  requireApprovalThreshold: boolean;
  minConfidenceThreshold: number;
  maxLayoutsPerRefactoring: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  refactoringTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validationRulesEnabled: boolean;
  preserveRouting: boolean;
  preserveBusinessLogic: boolean;
};

export const DEFAULT_LAYOUT_REFACTORING_CONFIGURATION: LayoutRefactoringConfiguration = {
  enabled: true,
  allowedLayoutScopes: [...LAYOUT_SCOPES],
  allowedTargetDirectories: [
    "empireai-web/app",
    "empireai-web/components/cockpit",
    "empireai-web/components/platform",
    "empireai-web/components/generated",
  ],
  protectedFiles: [
    "package.json",
    "tsconfig.json",
    "backend/",
    "pillow/src/session.ts",
    "pillow/src/index.ts",
  ],
  responsiveBreakpointRules: ["sm:640px", "md:768px", "lg:1024px", "xl:1280px"],
  spacingRules: ["gap-2", "gap-4", "gap-6", "p-4", "p-6"],
  alignmentRules: ["items-start", "items-center", "justify-between", "justify-center"],
  componentPlacementRulesEnabled: true,
  designSystemConstraintsEnabled: true,
  executivePreferenceConstraintsEnabled: true,
  safetyRulesEnabled: true,
  requireApprovalThreshold: true,
  minConfidenceThreshold: 0.4,
  maxLayoutsPerRefactoring: 15,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  refactoringTimeoutMs: 120000,
  loggingLevel: "info",
  autoRecover: true,
  validationRulesEnabled: true,
  preserveRouting: true,
  preserveBusinessLogic: true,
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

export function loadLayoutRefactoringConfigFile(
  repositoryRoot: string,
): Partial<LayoutRefactoringConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "layout-refactoring.config.json"),
    join(repositoryRoot, "config", "layout-refactoring.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<LayoutRefactoringConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildLayoutRefactoringConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LayoutRefactoringConfiguration> = {},
): LayoutRefactoringConfiguration {
  const fileConfig = repositoryRoot ? loadLayoutRefactoringConfigFile(repositoryRoot) : null;
  const envConfig: Partial<LayoutRefactoringConfiguration> = {
    enabled: envBool(
      "LAYOUT_REFACTORING_ENABLED",
      DEFAULT_LAYOUT_REFACTORING_CONFIGURATION.enabled,
    ),
    minConfidenceThreshold: envFloat(
      "LAYOUT_REFACTORING_CONFIDENCE_THRESHOLD",
      DEFAULT_LAYOUT_REFACTORING_CONFIGURATION.minConfidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "LAYOUT_REFACTORING_MAX_RETRIES",
      DEFAULT_LAYOUT_REFACTORING_CONFIGURATION.maxRetryAttempts,
    ),
    refactoringTimeoutMs: envInt(
      "LAYOUT_REFACTORING_TIMEOUT_MS",
      DEFAULT_LAYOUT_REFACTORING_CONFIGURATION.refactoringTimeoutMs,
    ),
    loggingLevel: envString(
      "LAYOUT_REFACTORING_LOG_LEVEL",
      DEFAULT_LAYOUT_REFACTORING_CONFIGURATION.loggingLevel,
    ) as LayoutRefactoringConfiguration["loggingLevel"],
    autoRecover: envBool(
      "LAYOUT_REFACTORING_AUTO_RECOVER",
      DEFAULT_LAYOUT_REFACTORING_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_LAYOUT_REFACTORING_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
