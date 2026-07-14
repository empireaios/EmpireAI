/** T1-03 — Externalized Component Recognition configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_COMPONENT_TYPE_RULES } from "./component-type-rules.js";
import type { ComponentTypeRule } from "./component-type-rules.js";

export type ComponentRecognitionConfiguration = {
  enabled: boolean;
  recognitionIntervalMs: number;
  maxRecognitionRate: number;
  confidenceThreshold: number;
  componentTypeRules: ComponentTypeRule[];
  identityMatchTolerance: number;
  resultBufferLimit: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  recognitionTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validateResults: boolean;
};

export const DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION: ComponentRecognitionConfiguration = {
  enabled: true,
  recognitionIntervalMs: 1000,
  maxRecognitionRate: 5,
  confidenceThreshold: 0.5,
  componentTypeRules: [...DEFAULT_COMPONENT_TYPE_RULES],
  identityMatchTolerance: 0.15,
  resultBufferLimit: 30,
  maxRetryAttempts: 5,
  retryDelayMs: 2000,
  recognitionTimeoutMs: 10000,
  loggingLevel: "info",
  autoRecover: true,
  validateResults: true,
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

export function loadComponentRecognitionConfigFile(
  repositoryRoot: string,
): Partial<ComponentRecognitionConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "component-recognition.config.json"),
    join(repositoryRoot, "config", "component-recognition.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ComponentRecognitionConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildComponentRecognitionConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ComponentRecognitionConfiguration> = {},
): ComponentRecognitionConfiguration {
  const fileConfig = repositoryRoot ? loadComponentRecognitionConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ComponentRecognitionConfiguration> = {
    enabled: envBool(
      "COMPONENT_RECOGNITION_ENABLED",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.enabled,
    ),
    recognitionIntervalMs: envInt(
      "COMPONENT_RECOGNITION_INTERVAL_MS",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.recognitionIntervalMs,
    ),
    maxRecognitionRate: envInt(
      "COMPONENT_RECOGNITION_MAX_RATE",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.maxRecognitionRate,
    ),
    confidenceThreshold: envFloat(
      "COMPONENT_RECOGNITION_CONFIDENCE",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.confidenceThreshold,
    ),
    identityMatchTolerance: envFloat(
      "COMPONENT_RECOGNITION_IDENTITY_TOLERANCE",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.identityMatchTolerance,
    ),
    resultBufferLimit: envInt(
      "COMPONENT_RECOGNITION_BUFFER_LIMIT",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.resultBufferLimit,
    ),
    maxRetryAttempts: envInt(
      "COMPONENT_RECOGNITION_MAX_RETRIES",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.maxRetryAttempts,
    ),
    retryDelayMs: envInt(
      "COMPONENT_RECOGNITION_RETRY_DELAY_MS",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.retryDelayMs,
    ),
    recognitionTimeoutMs: envInt(
      "COMPONENT_RECOGNITION_TIMEOUT_MS",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.recognitionTimeoutMs,
    ),
    loggingLevel: envString(
      "COMPONENT_RECOGNITION_LOG_LEVEL",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.loggingLevel,
    ) as ComponentRecognitionConfiguration["loggingLevel"],
    autoRecover: envBool(
      "COMPONENT_RECOGNITION_AUTO_RECOVER",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.autoRecover,
    ),
    validateResults: envBool(
      "COMPONENT_RECOGNITION_VALIDATE",
      DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION.validateResults,
    ),
  };

  return {
    ...DEFAULT_COMPONENT_RECOGNITION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}

export function effectiveRecognitionIntervalMs(
  config: ComponentRecognitionConfiguration,
): number {
  const minInterval = Math.ceil(1000 / Math.max(1, config.maxRecognitionRate));
  return Math.max(minInterval, config.recognitionIntervalMs);
}
