/** T4-03 — Externalized Screen Annotation configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ANNOTATION_TYPES } from "./paths.js";
import type { AnnotationType } from "./types.js";

export type ScreenAnnotationConfiguration = {
  enabled: boolean;
  annotationCaptureRulesEnabled: boolean;
  pointerCaptureRulesEnabled: boolean;
  coordinateMappingRulesEnabled: boolean;
  componentMatchingRulesEnabled: boolean;
  layoutRegionMatchingRulesEnabled: boolean;
  navigationMatchingRulesEnabled: boolean;
  uxFindingLinkageRulesEnabled: boolean;
  builderCapabilityLinkageRulesEnabled: boolean;
  clarificationRulesEnabled: boolean;
  confidenceThreshold: number;
  clarificationConfidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  annotationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  supportedAnnotationTypes: AnnotationType[];
  outputValidationEnabled: boolean;
  maxHistoryAnnotations: number;
  overlapTolerancePx: number;
};

export const DEFAULT_SCREEN_ANNOTATION_CONFIGURATION: ScreenAnnotationConfiguration = {
  enabled: true,
  annotationCaptureRulesEnabled: true,
  pointerCaptureRulesEnabled: true,
  coordinateMappingRulesEnabled: true,
  componentMatchingRulesEnabled: true,
  layoutRegionMatchingRulesEnabled: true,
  navigationMatchingRulesEnabled: true,
  uxFindingLinkageRulesEnabled: true,
  builderCapabilityLinkageRulesEnabled: true,
  clarificationRulesEnabled: true,
  confidenceThreshold: 0.55,
  clarificationConfidenceThreshold: 0.45,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  annotationTimeoutMs: 120000,
  loggingLevel: "info",
  autoRecover: true,
  supportedAnnotationTypes: [...ANNOTATION_TYPES],
  outputValidationEnabled: true,
  maxHistoryAnnotations: 50,
  overlapTolerancePx: 4,
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

export function loadScreenAnnotationConfigFile(
  repositoryRoot: string,
): Partial<ScreenAnnotationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "screen-annotation.config.json"),
    join(repositoryRoot, "config", "screen-annotation.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ScreenAnnotationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildScreenAnnotationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ScreenAnnotationConfiguration> = {},
): ScreenAnnotationConfiguration {
  const fileConfig = repositoryRoot ? loadScreenAnnotationConfigFile(repositoryRoot) : null;

  const envConfig: Partial<ScreenAnnotationConfiguration> = {
    enabled: envBool(
      "SCREEN_ANNOTATION_ENABLED",
      DEFAULT_SCREEN_ANNOTATION_CONFIGURATION.enabled,
    ),
    confidenceThreshold: envFloat(
      "SCREEN_ANNOTATION_CONFIDENCE_THRESHOLD",
      DEFAULT_SCREEN_ANNOTATION_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "SCREEN_ANNOTATION_MAX_RETRIES",
      DEFAULT_SCREEN_ANNOTATION_CONFIGURATION.maxRetryAttempts,
    ),
    annotationTimeoutMs: envInt(
      "SCREEN_ANNOTATION_TIMEOUT_MS",
      DEFAULT_SCREEN_ANNOTATION_CONFIGURATION.annotationTimeoutMs,
    ),
    loggingLevel: envString(
      "SCREEN_ANNOTATION_LOG_LEVEL",
      DEFAULT_SCREEN_ANNOTATION_CONFIGURATION.loggingLevel,
    ) as ScreenAnnotationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SCREEN_ANNOTATION_AUTO_RECOVER",
      DEFAULT_SCREEN_ANNOTATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_SCREEN_ANNOTATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}
