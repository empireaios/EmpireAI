/** T5-01 — Externalized Continuous Screen Observation configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ContinuousScreenObservationConfiguration = {
  enabled: boolean;
  continuousObservationEnabled: boolean;
  observationFrequencyMs: number;
  changeDetectionRulesEnabled: boolean;
  screenMonitoringRulesEnabled: boolean;
  routeMonitoringRulesEnabled: boolean;
  componentMonitoringRulesEnabled: boolean;
  layoutMonitoringRulesEnabled: boolean;
  confidenceThreshold: number;
  validationRulesEnabled: boolean;
  maxRetryAttempts: number;
  retryDelayMs: number;
  observationTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  outputValidationEnabled: boolean;
  maxHistoryObservations: number;
  observeOnlyMode: boolean;
};

export const DEFAULT_CONTINUOUS_SCREEN_OBSERVATION_CONFIGURATION: ContinuousScreenObservationConfiguration =
  {
    enabled: true,
    continuousObservationEnabled: true,
    observationFrequencyMs: 2000,
    changeDetectionRulesEnabled: true,
    screenMonitoringRulesEnabled: true,
    routeMonitoringRulesEnabled: true,
    componentMonitoringRulesEnabled: true,
    layoutMonitoringRulesEnabled: true,
    confidenceThreshold: 0.55,
    validationRulesEnabled: true,
    maxRetryAttempts: 3,
    retryDelayMs: 500,
    observationTimeoutMs: 30000,
    loggingLevel: "info",
    autoRecover: true,
    outputValidationEnabled: true,
    maxHistoryObservations: 200,
    observeOnlyMode: true,
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

export function loadContinuousScreenObservationConfigFile(
  repositoryRoot: string,
): Partial<ContinuousScreenObservationConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "continuous-screen-observation.config.json"),
    join(repositoryRoot, "config", "continuous-screen-observation.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<ContinuousScreenObservationConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildContinuousScreenObservationConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ContinuousScreenObservationConfiguration> = {},
): ContinuousScreenObservationConfiguration {
  const fileConfig = repositoryRoot
    ? loadContinuousScreenObservationConfigFile(repositoryRoot)
    : null;

  const envConfig: Partial<ContinuousScreenObservationConfiguration> = {
    enabled: envBool(
      "CONTINUOUS_SCREEN_OBSERVATION_ENABLED",
      DEFAULT_CONTINUOUS_SCREEN_OBSERVATION_CONFIGURATION.enabled,
    ),
    continuousObservationEnabled: envBool(
      "CONTINUOUS_SCREEN_OBSERVATION_CONTINUOUS",
      DEFAULT_CONTINUOUS_SCREEN_OBSERVATION_CONFIGURATION.continuousObservationEnabled,
    ),
    observationFrequencyMs: envInt(
      "CONTINUOUS_SCREEN_OBSERVATION_FREQUENCY_MS",
      DEFAULT_CONTINUOUS_SCREEN_OBSERVATION_CONFIGURATION.observationFrequencyMs,
    ),
    confidenceThreshold: envFloat(
      "CONTINUOUS_SCREEN_OBSERVATION_CONFIDENCE_THRESHOLD",
      DEFAULT_CONTINUOUS_SCREEN_OBSERVATION_CONFIGURATION.confidenceThreshold,
    ),
    maxRetryAttempts: envInt(
      "CONTINUOUS_SCREEN_OBSERVATION_MAX_RETRIES",
      DEFAULT_CONTINUOUS_SCREEN_OBSERVATION_CONFIGURATION.maxRetryAttempts,
    ),
    observationTimeoutMs: envInt(
      "CONTINUOUS_SCREEN_OBSERVATION_TIMEOUT_MS",
      DEFAULT_CONTINUOUS_SCREEN_OBSERVATION_CONFIGURATION.observationTimeoutMs,
    ),
    loggingLevel: envString(
      "CONTINUOUS_SCREEN_OBSERVATION_LOG_LEVEL",
      DEFAULT_CONTINUOUS_SCREEN_OBSERVATION_CONFIGURATION.loggingLevel,
    ) as ContinuousScreenObservationConfiguration["loggingLevel"],
    autoRecover: envBool(
      "CONTINUOUS_SCREEN_OBSERVATION_AUTO_RECOVER",
      DEFAULT_CONTINUOUS_SCREEN_OBSERVATION_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_CONTINUOUS_SCREEN_OBSERVATION_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    observeOnlyMode: true,
  };
}
