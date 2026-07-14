/** T3-05 — Externalized Preview Generator configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PREVIEW_SCOPES } from "./paths.js";
import type { PreviewScope } from "./types.js";

export type PreviewGeneratorConfiguration = {
  enabled: boolean;
  allowedPreviewScopes: PreviewScope[];
  previewEnvironmentRules: string[];
  previewRouteRules: string[];
  previewRetentionMs: number;
  previewCleanupEnabled: boolean;
  maxActiveEnvironments: number;
  protectedProductionRules: string[];
  previewBasePath: string;
  previewRoutePrefix: string;
  isolateFromProduction: boolean;
  maxPreviewsPerGeneration: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  buildTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validationRulesEnabled: boolean;
};

export const DEFAULT_PREVIEW_GENERATOR_CONFIGURATION: PreviewGeneratorConfiguration = {
  enabled: true,
  allowedPreviewScopes: [...PREVIEW_SCOPES],
  previewEnvironmentRules: ["isolated", "non-persistent", "sandboxed"],
  previewRouteRules: ["/preview/", "/dev/preview/"],
  previewRetentionMs: 3600000,
  previewCleanupEnabled: true,
  maxActiveEnvironments: 10,
  protectedProductionRules: [
    "no-production-deploy",
    "no-production-routing",
    "no-database-changes",
  ],
  previewBasePath: "empireai-web/.preview",
  previewRoutePrefix: "/preview",
  isolateFromProduction: true,
  maxPreviewsPerGeneration: 15,
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

function envString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export function loadPreviewGeneratorConfigFile(
  repositoryRoot: string,
): Partial<PreviewGeneratorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "preview-generator.config.json"),
    join(repositoryRoot, "config", "preview-generator.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<PreviewGeneratorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildPreviewGeneratorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PreviewGeneratorConfiguration> = {},
): PreviewGeneratorConfiguration {
  const fileConfig = repositoryRoot ? loadPreviewGeneratorConfigFile(repositoryRoot) : null;
  const envConfig: Partial<PreviewGeneratorConfiguration> = {
    enabled: envBool("PREVIEW_GENERATOR_ENABLED", DEFAULT_PREVIEW_GENERATOR_CONFIGURATION.enabled),
    maxRetryAttempts: envInt(
      "PREVIEW_GENERATOR_MAX_RETRIES",
      DEFAULT_PREVIEW_GENERATOR_CONFIGURATION.maxRetryAttempts,
    ),
    buildTimeoutMs: envInt(
      "PREVIEW_GENERATOR_TIMEOUT_MS",
      DEFAULT_PREVIEW_GENERATOR_CONFIGURATION.buildTimeoutMs,
    ),
    loggingLevel: envString(
      "PREVIEW_GENERATOR_LOG_LEVEL",
      DEFAULT_PREVIEW_GENERATOR_CONFIGURATION.loggingLevel,
    ) as PreviewGeneratorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "PREVIEW_GENERATOR_AUTO_RECOVER",
      DEFAULT_PREVIEW_GENERATOR_CONFIGURATION.autoRecover,
    ),
    previewRetentionMs: envInt(
      "PREVIEW_GENERATOR_RETENTION_MS",
      DEFAULT_PREVIEW_GENERATOR_CONFIGURATION.previewRetentionMs,
    ),
  };

  return {
    ...DEFAULT_PREVIEW_GENERATOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
