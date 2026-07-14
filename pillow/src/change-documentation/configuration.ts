/** T3-09 — Externalized Change Documentation configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { CHANGE_TYPES, DOCUMENTATION_SCOPES } from "./paths.js";
import type { ChangeType, DocumentationScope } from "./types.js";

export type ChangeDocumentationConfiguration = {
  enabled: boolean;
  documentationScopes: DocumentationScope[];
  documentationOutputLocation: string;
  documentationFormat: "json" | "markdown" | "structured";
  requiredMetadataFields: string[];
  evidenceReferenceRulesEnabled: boolean;
  fileChangeSummaryRulesEnabled: boolean;
  uxRationaleRulesEnabled: boolean;
  safetySummaryRulesEnabled: boolean;
  retentionMs: number;
  maxRecordsPerRun: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  documentationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  supportedChangeTypes: ChangeType[];
};

export const DEFAULT_CHANGE_DOCUMENTATION_CONFIGURATION: ChangeDocumentationConfiguration = {
  enabled: true,
  documentationScopes: [...DOCUMENTATION_SCOPES],
  documentationOutputLocation: ".pillow-change-documentation",
  documentationFormat: "structured",
  requiredMetadataFields: [
    "changeDocumentationId",
    "changeType",
    "changeSummary",
    "uxRationale",
    "affectedFiles",
  ],
  evidenceReferenceRulesEnabled: true,
  fileChangeSummaryRulesEnabled: true,
  uxRationaleRulesEnabled: true,
  safetySummaryRulesEnabled: true,
  retentionMs: 604800000,
  maxRecordsPerRun: 50,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  documentationTimeoutMs: 120000,
  loggingLevel: "info",
  autoRecover: true,
  outputValidationEnabled: true,
  supportedChangeTypes: [...CHANGE_TYPES],
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

export function loadChangeDocumentationConfigFile(
  repositoryRoot: string,
): Partial<ChangeDocumentationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "change-documentation.config.json"),
    join(repositoryRoot, "config", "change-documentation.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ChangeDocumentationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildChangeDocumentationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ChangeDocumentationConfiguration> = {},
): ChangeDocumentationConfiguration {
  const fileConfig = repositoryRoot ? loadChangeDocumentationConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ChangeDocumentationConfiguration> = {
    enabled: envBool(
      "CHANGE_DOCUMENTATION_ENABLED",
      DEFAULT_CHANGE_DOCUMENTATION_CONFIGURATION.enabled,
    ),
    documentationOutputLocation: envString(
      "CHANGE_DOCUMENTATION_OUTPUT",
      DEFAULT_CHANGE_DOCUMENTATION_CONFIGURATION.documentationOutputLocation,
    ),
    maxRetryAttempts: envInt(
      "CHANGE_DOCUMENTATION_MAX_RETRIES",
      DEFAULT_CHANGE_DOCUMENTATION_CONFIGURATION.maxRetryAttempts,
    ),
    documentationTimeoutMs: envInt(
      "CHANGE_DOCUMENTATION_TIMEOUT_MS",
      DEFAULT_CHANGE_DOCUMENTATION_CONFIGURATION.documentationTimeoutMs,
    ),
    loggingLevel: envString(
      "CHANGE_DOCUMENTATION_LOG_LEVEL",
      DEFAULT_CHANGE_DOCUMENTATION_CONFIGURATION.loggingLevel,
    ) as ChangeDocumentationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CHANGE_DOCUMENTATION_AUTO_RECOVER",
      DEFAULT_CHANGE_DOCUMENTATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CHANGE_DOCUMENTATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
