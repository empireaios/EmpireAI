/** X1-13 — Externalized Launch Monitoring Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type LaunchMonitoringEngineConfiguration = {
  enabled: boolean;
  monitoringFrequencySeconds: number;
  alertThreshold: number;
  healthScoringRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  recommendationRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverModifyProductionOperationsWithoutValidation: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxMonitoringRecordsPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_LAUNCH_MONITORING_ENGINE_CONFIGURATION: LaunchMonitoringEngineConfiguration =
  {
    enabled: true,
    monitoringFrequencySeconds: 60,
    alertThreshold: 60,
    healthScoringRulesEnabled: true,
    validationRulesEnabled: true,
    anomalyDetectionEnabled: true,
    recommendationRulesEnabled: true,
    neverExposeCredentials: true,
    neverModifyProductionOperationsWithoutValidation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    maxMonitoringRecordsPerCycle: 24,
    connectionTimeoutMs: 30000,
    maxRetryAttempts: 3,
    retryDelayMs: 1000,
    retryBackoffMultiplier: 2,
    loggingLevel: "info",
    autoRecover: true,
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

export function loadLaunchMonitoringEngineConfigFile(
  repositoryRoot: string,
): Partial<LaunchMonitoringEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "launch-monitoring-engine.config.json"),
    join(repositoryRoot, "config", "launch-monitoring-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<LaunchMonitoringEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildLaunchMonitoringEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LaunchMonitoringEngineConfiguration> = {},
): LaunchMonitoringEngineConfiguration {
  const fileConfig = repositoryRoot
    ? loadLaunchMonitoringEngineConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<LaunchMonitoringEngineConfiguration> = {
    enabled: envBool(
      "LAUNCH_MONITORING_ENGINE_ENABLED",
      DEFAULT_LAUNCH_MONITORING_ENGINE_CONFIGURATION.enabled,
    ),
    monitoringFrequencySeconds: envInt(
      "LAUNCH_MONITORING_ENGINE_FREQUENCY_SECONDS",
      DEFAULT_LAUNCH_MONITORING_ENGINE_CONFIGURATION.monitoringFrequencySeconds,
    ),
    alertThreshold: envInt(
      "LAUNCH_MONITORING_ENGINE_ALERT_THRESHOLD",
      DEFAULT_LAUNCH_MONITORING_ENGINE_CONFIGURATION.alertThreshold,
    ),
    connectionTimeoutMs: envInt(
      "LAUNCH_MONITORING_ENGINE_TIMEOUT_MS",
      DEFAULT_LAUNCH_MONITORING_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "LAUNCH_MONITORING_ENGINE_MAX_RETRIES",
      DEFAULT_LAUNCH_MONITORING_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "LAUNCH_MONITORING_ENGINE_LOG_LEVEL",
      DEFAULT_LAUNCH_MONITORING_ENGINE_CONFIGURATION.loggingLevel,
    ) as LaunchMonitoringEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "LAUNCH_MONITORING_ENGINE_AUTO_RECOVER",
      DEFAULT_LAUNCH_MONITORING_ENGINE_CONFIGURATION.autoRecover,
    ),
    maxMonitoringRecordsPerCycle: envInt(
      "LAUNCH_MONITORING_ENGINE_MAX_RECORDS",
      DEFAULT_LAUNCH_MONITORING_ENGINE_CONFIGURATION.maxMonitoringRecordsPerCycle,
    ),
  };

  return {
    ...DEFAULT_LAUNCH_MONITORING_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverModifyProductionOperationsWithoutValidation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
