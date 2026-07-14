/** T3-01 — Externalized Frontend Builder configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CODE_GENERATION_SCOPES } from "./paths.js";
import type { CodeGenerationScope } from "./types.js";

export type FrontendBuilderConfiguration = {
  enabled: boolean;
  codeGenerationScopes: CodeGenerationScope[];
  allowedTargetDirectories: string[];
  protectedFiles: string[];
  designSystemConstraintsEnabled: boolean;
  executivePreferenceConstraintsEnabled: boolean;
  safetyRulesEnabled: boolean;
  requireUxCertificationPass: boolean;
  requireApprovalThreshold: boolean;
  minConfidenceThreshold: number;
  maxRecordsPerBuild: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  buildTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validationRulesEnabled: boolean;
};

export const DEFAULT_FRONTEND_BUILDER_CONFIGURATION: FrontendBuilderConfiguration = {
  enabled: true,
  codeGenerationScopes: [...CODE_GENERATION_SCOPES],
  allowedTargetDirectories: [
    "empireai-web/components",
    "empireai-web/app",
    "empireai-web/lib",
  ],
  protectedFiles: [
    "package.json",
    "tsconfig.json",
    "backend/",
    "pillow/src/session.ts",
    "pillow/src/index.ts",
  ],
  designSystemConstraintsEnabled: true,
  executivePreferenceConstraintsEnabled: true,
  safetyRulesEnabled: true,
  requireUxCertificationPass: false,
  requireApprovalThreshold: true,
  minConfidenceThreshold: 0.4,
  maxRecordsPerBuild: 25,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  buildTimeoutMs: 120000,
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

export function loadFrontendBuilderConfigFile(
  repositoryRoot: string,
): Partial<FrontendBuilderConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "frontend-builder.config.json"),
    join(repositoryRoot, "config", "frontend-builder.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<FrontendBuilderConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildFrontendBuilderConfiguration(
  repositoryRoot?: string,
  overrides: Partial<FrontendBuilderConfiguration> = {},
): FrontendBuilderConfiguration {
  const fileConfig = repositoryRoot ? loadFrontendBuilderConfigFile(repositoryRoot) : null;
  const envConfig: Partial<FrontendBuilderConfiguration> = {
    enabled: envBool(
      "FRONTEND_BUILDER_ENABLED",
      DEFAULT_FRONTEND_BUILDER_CONFIGURATION.enabled,
    ),
    minConfidenceThreshold: envFloat(
      "FRONTEND_BUILDER_CONFIDENCE_THRESHOLD",
      DEFAULT_FRONTEND_BUILDER_CONFIGURATION.minConfidenceThreshold,
    ),
    requireUxCertificationPass: envBool(
      "FRONTEND_BUILDER_REQUIRE_UX_CERT",
      DEFAULT_FRONTEND_BUILDER_CONFIGURATION.requireUxCertificationPass,
    ),
    maxRetryAttempts: envInt(
      "FRONTEND_BUILDER_MAX_RETRIES",
      DEFAULT_FRONTEND_BUILDER_CONFIGURATION.maxRetryAttempts,
    ),
    buildTimeoutMs: envInt(
      "FRONTEND_BUILDER_TIMEOUT_MS",
      DEFAULT_FRONTEND_BUILDER_CONFIGURATION.buildTimeoutMs,
    ),
    loggingLevel: envString(
      "FRONTEND_BUILDER_LOG_LEVEL",
      DEFAULT_FRONTEND_BUILDER_CONFIGURATION.loggingLevel,
    ) as FrontendBuilderConfiguration["loggingLevel"],
    autoRecover: envBool(
      "FRONTEND_BUILDER_AUTO_RECOVER",
      DEFAULT_FRONTEND_BUILDER_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_FRONTEND_BUILDER_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
