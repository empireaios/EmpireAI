/** T1-05 — Externalized Navigation Mapping configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_SCREEN_IDENTITY_RULES, type ScreenIdentityRule } from "./screen-identity-rules.js";
import {
  DEFAULT_NAVIGATION_COMPONENT_RULES,
  type NavigationComponentRule,
} from "./navigation-entry-rules.js";

export type NavigationMappingConfiguration = {
  enabled: boolean;
  mappingIntervalMs: number;
  maxMappingRate: number;
  confidenceThreshold: number;
  screenIdentityRules: ScreenIdentityRule[];
  navigationComponentRules: NavigationComponentRule[];
  transitionDetectionEnabled: boolean;
  graphUpdateMerge: boolean;
  graphBufferLimit: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  mappingTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validateGraphs: boolean;
};

export const DEFAULT_NAVIGATION_MAPPING_CONFIGURATION: NavigationMappingConfiguration = {
  enabled: true,
  mappingIntervalMs: 1000,
  maxMappingRate: 5,
  confidenceThreshold: 0.5,
  screenIdentityRules: [...DEFAULT_SCREEN_IDENTITY_RULES],
  navigationComponentRules: [...DEFAULT_NAVIGATION_COMPONENT_RULES],
  transitionDetectionEnabled: true,
  graphUpdateMerge: true,
  graphBufferLimit: 30,
  maxRetryAttempts: 5,
  retryDelayMs: 2000,
  mappingTimeoutMs: 10000,
  loggingLevel: "info",
  autoRecover: true,
  validateGraphs: true,
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

export function loadNavigationMappingConfigFile(
  repositoryRoot: string,
): Partial<NavigationMappingConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "navigation-mapping.config.json"),
    join(repositoryRoot, "config", "navigation-mapping.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<NavigationMappingConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildNavigationMappingConfiguration(
  repositoryRoot?: string,
  overrides: Partial<NavigationMappingConfiguration> = {},
): NavigationMappingConfiguration {
  const fileConfig = repositoryRoot ? loadNavigationMappingConfigFile(repositoryRoot) : null;
  const envConfig: Partial<NavigationMappingConfiguration> = {
    enabled: envBool("NAVIGATION_MAPPING_ENABLED", DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.enabled),
    mappingIntervalMs: envInt(
      "NAVIGATION_MAPPING_INTERVAL_MS",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.mappingIntervalMs,
    ),
    maxMappingRate: envInt(
      "NAVIGATION_MAPPING_MAX_RATE",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.maxMappingRate,
    ),
    confidenceThreshold: envFloat(
      "NAVIGATION_MAPPING_CONFIDENCE",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.confidenceThreshold,
    ),
    graphBufferLimit: envInt(
      "NAVIGATION_MAPPING_BUFFER_LIMIT",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.graphBufferLimit,
    ),
    maxRetryAttempts: envInt(
      "NAVIGATION_MAPPING_MAX_RETRIES",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.maxRetryAttempts,
    ),
    retryDelayMs: envInt(
      "NAVIGATION_MAPPING_RETRY_DELAY_MS",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.retryDelayMs,
    ),
    mappingTimeoutMs: envInt(
      "NAVIGATION_MAPPING_TIMEOUT_MS",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.mappingTimeoutMs,
    ),
    loggingLevel: envString(
      "NAVIGATION_MAPPING_LOG_LEVEL",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.loggingLevel,
    ) as NavigationMappingConfiguration["loggingLevel"],
    autoRecover: envBool(
      "NAVIGATION_MAPPING_AUTO_RECOVER",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.autoRecover,
    ),
    validateGraphs: envBool(
      "NAVIGATION_MAPPING_VALIDATE",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.validateGraphs,
    ),
    transitionDetectionEnabled: envBool(
      "NAVIGATION_MAPPING_TRANSITIONS",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.transitionDetectionEnabled,
    ),
    graphUpdateMerge: envBool(
      "NAVIGATION_MAPPING_MERGE",
      DEFAULT_NAVIGATION_MAPPING_CONFIGURATION.graphUpdateMerge,
    ),
  };

  return {
    ...DEFAULT_NAVIGATION_MAPPING_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}

export function effectiveMappingIntervalMs(config: NavigationMappingConfiguration): number {
  const minInterval = Math.ceil(1000 / Math.max(1, config.maxMappingRate));
  return Math.max(minInterval, config.mappingIntervalMs);
}
