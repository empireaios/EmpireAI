/** T5-06 — Externalized Adaptive Interface configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type AdaptiveInterfaceConfiguration = {
  enabled: boolean;
  continuousAdaptationEnabled: boolean;
  contextDetectionFrequencyMs: number;
  adaptationRulesEnabled: boolean;
  personalizationRulesEnabled: boolean;
  workspaceAdaptationRulesEnabled: boolean;
  navigationAdaptationRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  adaptationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  maxHistoryAdaptationCycles: number;
  deduplicateAdaptations: boolean;
  recommendOnlyMode: boolean;
};

export const DEFAULT_ADAPTIVE_INTERFACE_CONFIGURATION: AdaptiveInterfaceConfiguration = {
  enabled: true,
  continuousAdaptationEnabled: true,
  contextDetectionFrequencyMs: 15000,
  adaptationRulesEnabled: true,
  personalizationRulesEnabled: true,
  workspaceAdaptationRulesEnabled: true,
  navigationAdaptationRulesEnabled: true,
  confidenceThreshold: 0.45,
  validationRulesEnabled: true,
  maxRetryAttempts: 3,
  retryDelayMs: 500,
  adaptationTimeoutMs: 60000,
  loggingLevel: "info",
  autoRecover: true,
  outputValidationEnabled: true,
  maxHistoryAdaptationCycles: 120,
  deduplicateAdaptations: true,
  recommendOnlyMode: true,
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

export function loadAdaptiveInterfaceConfigFile(
  repositoryRoot: string,
): Partial<AdaptiveInterfaceConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "adaptive-interface.config.json"),
    join(repositoryRoot, "config", "adaptive-interface.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<AdaptiveInterfaceConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildAdaptiveInterfaceConfiguration(
  repositoryRoot?: string,
  overrides: Partial<AdaptiveInterfaceConfiguration> = {},
): AdaptiveInterfaceConfiguration {
  const fileConfig = repositoryRoot
    ? loadAdaptiveInterfaceConfigFile(repositoryRoot)
    : null;

  const envConfig: Partial<AdaptiveInterfaceConfiguration> = {
    enabled: envBool(
      "ADAPTIVE_INTERFACE_ENABLED",
      DEFAULT_ADAPTIVE_INTERFACE_CONFIGURATION.enabled,
    ),
    continuousAdaptationEnabled: envBool(
      "ADAPTIVE_INTERFACE_CONTINUOUS",
      DEFAULT_ADAPTIVE_INTERFACE_CONFIGURATION.continuousAdaptationEnabled,
    ),
    contextDetectionFrequencyMs: envInt(
      "ADAPTIVE_INTERFACE_FREQUENCY_MS",
      DEFAULT_ADAPTIVE_INTERFACE_CONFIGURATION.contextDetectionFrequencyMs,
    ),
    confidenceThreshold: envFloat(
      "ADAPTIVE_INTERFACE_CONFIDENCE_THRESHOLD",
      DEFAULT_ADAPTIVE_INTERFACE_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "ADAPTIVE_INTERFACE_MAX_RETRIES",
      DEFAULT_ADAPTIVE_INTERFACE_CONFIGURATION.maxRetryAttempts,
    ),
    adaptationTimeoutMs: envInt(
      "ADAPTIVE_INTERFACE_TIMEOUT_MS",
      DEFAULT_ADAPTIVE_INTERFACE_CONFIGURATION.adaptationTimeoutMs,
    ),
    loggingLevel: envString(
      "ADAPTIVE_INTERFACE_LOG_LEVEL",
      DEFAULT_ADAPTIVE_INTERFACE_CONFIGURATION.loggingLevel,
    ) as AdaptiveInterfaceConfiguration["loggingLevel"],
    autoRecover: envBool(
      "ADAPTIVE_INTERFACE_AUTO_RECOVER",
      DEFAULT_ADAPTIVE_INTERFACE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_ADAPTIVE_INTERFACE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    recommendOnlyMode: true,
  };
}
