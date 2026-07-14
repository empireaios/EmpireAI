/** T1-04 — Externalized Layout Understanding configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_STRUCTURAL_REGION_RULES } from "./structural-region-rules.js";
import type { StructuralRegionRule } from "./structural-region-rules.js";

export type LayoutUnderstandingConfiguration = {
  enabled: boolean;
  analysisIntervalMs: number;
  maxAnalysisRate: number;
  confidenceThreshold: number;
  structuralRegionRules: StructuralRegionRule[];
  groupingThreshold: number;
  alignmentTolerance: number;
  responsiveBreakpoints: { name: string; minWidth: number; maxWidth: number }[];
  layoutBufferLimit: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  analysisTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validateLayouts: boolean;
};

export const DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION: LayoutUnderstandingConfiguration = {
  enabled: true,
  analysisIntervalMs: 1000,
  maxAnalysisRate: 5,
  confidenceThreshold: 0.5,
  structuralRegionRules: [...DEFAULT_STRUCTURAL_REGION_RULES],
  groupingThreshold: 24,
  alignmentTolerance: 16,
  responsiveBreakpoints: [
    { name: "mobile", minWidth: 0, maxWidth: 767 },
    { name: "tablet", minWidth: 768, maxWidth: 1023 },
    { name: "desktop", minWidth: 1024, maxWidth: 99999 },
  ],
  layoutBufferLimit: 30,
  maxRetryAttempts: 5,
  retryDelayMs: 2000,
  analysisTimeoutMs: 10000,
  loggingLevel: "info",
  autoRecover: true,
  validateLayouts: true,
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

export function loadLayoutUnderstandingConfigFile(
  repositoryRoot: string,
): Partial<LayoutUnderstandingConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "layout-understanding.config.json"),
    join(repositoryRoot, "config", "layout-understanding.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<LayoutUnderstandingConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildLayoutUnderstandingConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LayoutUnderstandingConfiguration> = {},
): LayoutUnderstandingConfiguration {
  const fileConfig = repositoryRoot ? loadLayoutUnderstandingConfigFile(repositoryRoot) : null;
  const envConfig: Partial<LayoutUnderstandingConfiguration> = {
    enabled: envBool("LAYOUT_UNDERSTANDING_ENABLED", DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.enabled),
    analysisIntervalMs: envInt(
      "LAYOUT_UNDERSTANDING_INTERVAL_MS",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.analysisIntervalMs,
    ),
    maxAnalysisRate: envInt(
      "LAYOUT_UNDERSTANDING_MAX_RATE",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.maxAnalysisRate,
    ),
    confidenceThreshold: envFloat(
      "LAYOUT_UNDERSTANDING_CONFIDENCE",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.confidenceThreshold,
    ),
    groupingThreshold: envInt(
      "LAYOUT_UNDERSTANDING_GROUPING_THRESHOLD",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.groupingThreshold,
    ),
    alignmentTolerance: envInt(
      "LAYOUT_UNDERSTANDING_ALIGNMENT_TOLERANCE",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.alignmentTolerance,
    ),
    layoutBufferLimit: envInt(
      "LAYOUT_UNDERSTANDING_BUFFER_LIMIT",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.layoutBufferLimit,
    ),
    maxRetryAttempts: envInt(
      "LAYOUT_UNDERSTANDING_MAX_RETRIES",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.maxRetryAttempts,
    ),
    retryDelayMs: envInt(
      "LAYOUT_UNDERSTANDING_RETRY_DELAY_MS",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.retryDelayMs,
    ),
    analysisTimeoutMs: envInt(
      "LAYOUT_UNDERSTANDING_TIMEOUT_MS",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.analysisTimeoutMs,
    ),
    loggingLevel: envString(
      "LAYOUT_UNDERSTANDING_LOG_LEVEL",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.loggingLevel,
    ) as LayoutUnderstandingConfiguration["loggingLevel"],
    autoRecover: envBool(
      "LAYOUT_UNDERSTANDING_AUTO_RECOVER",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.autoRecover,
    ),
    validateLayouts: envBool(
      "LAYOUT_UNDERSTANDING_VALIDATE",
      DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION.validateLayouts,
    ),
  };

  return {
    ...DEFAULT_LAYOUT_UNDERSTANDING_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}

export function effectiveAnalysisIntervalMs(config: LayoutUnderstandingConfiguration): number {
  const minInterval = Math.ceil(1000 / Math.max(1, config.maxAnalysisRate));
  return Math.max(minInterval, config.analysisIntervalMs);
}
