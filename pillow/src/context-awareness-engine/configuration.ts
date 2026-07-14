/** T1-07 — Externalized Context Awareness configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_SCREEN_PURPOSE_RULES,
  type ScreenPurposeRule,
} from "./screen-purpose-detector.js";
import {
  DEFAULT_INTERACTION_MODE_RULES,
  type InteractionModeRule,
} from "./workflow-context-engine.js";

export type ContextAwarenessConfiguration = {
  enabled: boolean;
  contextUpdateIntervalMs: number;
  maxUpdateRate: number;
  confidenceThreshold: number;
  screenPurposeRules: ScreenPurposeRule[];
  interactionModeRules: InteractionModeRule[];
  activeRegionTypes: string[];
  contextBufferLimit: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  contextTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validateContexts: boolean;
};

export const DEFAULT_CONTEXT_AWARENESS_CONFIGURATION: ContextAwarenessConfiguration = {
  enabled: true,
  contextUpdateIntervalMs: 1000,
  maxUpdateRate: 5,
  confidenceThreshold: 0.5,
  screenPurposeRules: [...DEFAULT_SCREEN_PURPOSE_RULES],
  interactionModeRules: [...DEFAULT_INTERACTION_MODE_RULES],
  activeRegionTypes: [
    "main_content",
    "form_area",
    "table_area",
    "panel",
    "modal",
    "dialog",
    "drawer",
    "sidebar",
    "search_area",
    "filter_area",
    "loading_state",
    "empty_state",
  ],
  contextBufferLimit: 30,
  maxRetryAttempts: 5,
  retryDelayMs: 2000,
  contextTimeoutMs: 10000,
  loggingLevel: "info",
  autoRecover: true,
  validateContexts: true,
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

export function loadContextAwarenessConfigFile(
  repositoryRoot: string,
): Partial<ContextAwarenessConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "context-awareness.config.json"),
    join(repositoryRoot, "config", "context-awareness.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ContextAwarenessConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildContextAwarenessConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ContextAwarenessConfiguration> = {},
): ContextAwarenessConfiguration {
  const fileConfig = repositoryRoot ? loadContextAwarenessConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ContextAwarenessConfiguration> = {
    enabled: envBool("CONTEXT_AWARENESS_ENABLED", DEFAULT_CONTEXT_AWARENESS_CONFIGURATION.enabled),
    contextUpdateIntervalMs: envInt(
      "CONTEXT_AWARENESS_INTERVAL_MS",
      DEFAULT_CONTEXT_AWARENESS_CONFIGURATION.contextUpdateIntervalMs,
    ),
    maxUpdateRate: envInt(
      "CONTEXT_AWARENESS_MAX_RATE",
      DEFAULT_CONTEXT_AWARENESS_CONFIGURATION.maxUpdateRate,
    ),
    confidenceThreshold: envFloat(
      "CONTEXT_AWARENESS_CONFIDENCE",
      DEFAULT_CONTEXT_AWARENESS_CONFIGURATION.confidenceThreshold,
    ),
    contextBufferLimit: envInt(
      "CONTEXT_AWARENESS_BUFFER_LIMIT",
      DEFAULT_CONTEXT_AWARENESS_CONFIGURATION.contextBufferLimit,
    ),
    maxRetryAttempts: envInt(
      "CONTEXT_AWARENESS_MAX_RETRIES",
      DEFAULT_CONTEXT_AWARENESS_CONFIGURATION.maxRetryAttempts,
    ),
    retryDelayMs: envInt(
      "CONTEXT_AWARENESS_RETRY_DELAY_MS",
      DEFAULT_CONTEXT_AWARENESS_CONFIGURATION.retryDelayMs,
    ),
    contextTimeoutMs: envInt(
      "CONTEXT_AWARENESS_TIMEOUT_MS",
      DEFAULT_CONTEXT_AWARENESS_CONFIGURATION.contextTimeoutMs,
    ),
    loggingLevel: envString(
      "CONTEXT_AWARENESS_LOG_LEVEL",
      DEFAULT_CONTEXT_AWARENESS_CONFIGURATION.loggingLevel,
    ) as ContextAwarenessConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CONTEXT_AWARENESS_AUTO_RECOVER",
      DEFAULT_CONTEXT_AWARENESS_CONFIGURATION.autoRecover,
    ),
    validateContexts: envBool(
      "CONTEXT_AWARENESS_VALIDATE",
      DEFAULT_CONTEXT_AWARENESS_CONFIGURATION.validateContexts,
    ),
  };

  return {
    ...DEFAULT_CONTEXT_AWARENESS_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}

export function effectiveContextUpdateIntervalMs(config: ContextAwarenessConfiguration): number {
  const minInterval = Math.ceil(1000 / Math.max(1, config.maxUpdateRate));
  return Math.max(minInterval, config.contextUpdateIntervalMs);
}
