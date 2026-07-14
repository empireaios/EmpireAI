/** T1-06 — Externalized Interaction Tracking configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SENSITIVE_FIELD_PATTERNS } from "./paths.js";

export type ComponentMappingRule = {
  componentType: string;
  interactionType: string;
  baseConfidence: number;
};

export type InteractionTrackingConfiguration = {
  enabled: boolean;
  trackingIntervalMs: number;
  maxTrackingRate: number;
  confidenceThreshold: number;
  eventBufferLimit: number;
  eventDebounceMs: number;
  eventSamplingRate: number;
  captureInputChanges: boolean;
  maskSensitiveValues: boolean;
  sensitiveFieldPatterns: string[];
  componentMappingRules: ComponentMappingRule[];
  maxRetryAttempts: number;
  retryDelayMs: number;
  trackingTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validateEvents: boolean;
};

export const DEFAULT_COMPONENT_MAPPING_RULES: ComponentMappingRule[] = [
  { componentType: "button", interactionType: "click", baseConfidence: 0.85 },
  { componentType: "link", interactionType: "click", baseConfidence: 0.82 },
  { componentType: "input", interactionType: "text_input", baseConfidence: 0.8 },
  { componentType: "text_field", interactionType: "text_input", baseConfidence: 0.8 },
  { componentType: "text_area", interactionType: "text_input", baseConfidence: 0.78 },
  { componentType: "dropdown", interactionType: "dropdown_select", baseConfidence: 0.82 },
  { componentType: "checkbox", interactionType: "checkbox_change", baseConfidence: 0.85 },
  { componentType: "radio_button", interactionType: "radio_change", baseConfidence: 0.85 },
  { componentType: "toggle", interactionType: "toggle_change", baseConfidence: 0.85 },
  { componentType: "tab", interactionType: "tab_switch", baseConfidence: 0.88 },
  { componentType: "modal", interactionType: "modal_open", baseConfidence: 0.9 },
  { componentType: "navigation_item", interactionType: "navigation_trigger", baseConfidence: 0.87 },
];

export const DEFAULT_INTERACTION_TRACKING_CONFIGURATION: InteractionTrackingConfiguration = {
  enabled: true,
  trackingIntervalMs: 500,
  maxTrackingRate: 10,
  confidenceThreshold: 0.5,
  eventBufferLimit: 200,
  eventDebounceMs: 50,
  eventSamplingRate: 1,
  captureInputChanges: true,
  maskSensitiveValues: true,
  sensitiveFieldPatterns: [...SENSITIVE_FIELD_PATTERNS],
  componentMappingRules: [...DEFAULT_COMPONENT_MAPPING_RULES],
  maxRetryAttempts: 5,
  retryDelayMs: 2000,
  trackingTimeoutMs: 10000,
  loggingLevel: "info",
  autoRecover: true,
  validateEvents: true,
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

export function loadInteractionTrackingConfigFile(
  repositoryRoot: string,
): Partial<InteractionTrackingConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "interaction-tracking.config.json"),
    join(repositoryRoot, "config", "interaction-tracking.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<InteractionTrackingConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildInteractionTrackingConfiguration(
  repositoryRoot?: string,
  overrides: Partial<InteractionTrackingConfiguration> = {},
): InteractionTrackingConfiguration {
  const fileConfig = repositoryRoot ? loadInteractionTrackingConfigFile(repositoryRoot) : null;
  const envConfig: Partial<InteractionTrackingConfiguration> = {
    enabled: envBool("INTERACTION_TRACKING_ENABLED", DEFAULT_INTERACTION_TRACKING_CONFIGURATION.enabled),
    trackingIntervalMs: envInt(
      "INTERACTION_TRACKING_INTERVAL_MS",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.trackingIntervalMs,
    ),
    maxTrackingRate: envInt(
      "INTERACTION_TRACKING_MAX_RATE",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.maxTrackingRate,
    ),
    confidenceThreshold: envFloat(
      "INTERACTION_TRACKING_CONFIDENCE",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.confidenceThreshold,
    ),
    eventBufferLimit: envInt(
      "INTERACTION_TRACKING_BUFFER_LIMIT",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.eventBufferLimit,
    ),
    eventDebounceMs: envInt(
      "INTERACTION_TRACKING_DEBOUNCE_MS",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.eventDebounceMs,
    ),
    maskSensitiveValues: envBool(
      "INTERACTION_TRACKING_MASK_SENSITIVE",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.maskSensitiveValues,
    ),
    maxRetryAttempts: envInt(
      "INTERACTION_TRACKING_MAX_RETRIES",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.maxRetryAttempts,
    ),
    retryDelayMs: envInt(
      "INTERACTION_TRACKING_RETRY_DELAY_MS",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.retryDelayMs,
    ),
    trackingTimeoutMs: envInt(
      "INTERACTION_TRACKING_TIMEOUT_MS",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.trackingTimeoutMs,
    ),
    loggingLevel: envString(
      "INTERACTION_TRACKING_LOG_LEVEL",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.loggingLevel,
    ) as InteractionTrackingConfiguration["loggingLevel"],
    autoRecover: envBool(
      "INTERACTION_TRACKING_AUTO_RECOVER",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.autoRecover,
    ),
    validateEvents: envBool(
      "INTERACTION_TRACKING_VALIDATE",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.validateEvents,
    ),
    captureInputChanges: envBool(
      "INTERACTION_TRACKING_CAPTURE_INPUT",
      DEFAULT_INTERACTION_TRACKING_CONFIGURATION.captureInputChanges,
    ),
  };

  return {
    ...DEFAULT_INTERACTION_TRACKING_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}

export function effectiveTrackingIntervalMs(config: InteractionTrackingConfiguration): number {
  const minInterval = Math.ceil(1000 / Math.max(1, config.maxTrackingRate));
  return Math.max(minInterval, config.trackingIntervalMs);
}
