/** X1-10 — Externalized Launch Readiness Validator configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type LaunchReadinessValidatorConfiguration = {
  enabled: boolean;
  readinessScoringRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  launchThreshold: number;
  healthMonitoringRulesEnabled: boolean;
  neverExposeCredentials: true;
  neverCertifyWithoutValidation: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  maxReadinessRecordsPerCycle: number;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
};

export const DEFAULT_LAUNCH_READINESS_VALIDATOR_CONFIGURATION: LaunchReadinessValidatorConfiguration =
  {
    enabled: true,
    readinessScoringRulesEnabled: true,
    validationRulesEnabled: true,
    launchThreshold: 75,
    healthMonitoringRulesEnabled: true,
    neverExposeCredentials: true,
    neverCertifyWithoutValidation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    maxReadinessRecordsPerCycle: 12,
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

export function loadLaunchReadinessValidatorConfigFile(
  repositoryRoot: string,
): Partial<LaunchReadinessValidatorConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "launch-readiness-validator.config.json"),
    join(repositoryRoot, "config", "launch-readiness-validator.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<LaunchReadinessValidatorConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildLaunchReadinessValidatorConfiguration(
  repositoryRoot?: string,
  overrides: Partial<LaunchReadinessValidatorConfiguration> = {},
): LaunchReadinessValidatorConfiguration {
  const fileConfig = repositoryRoot
    ? loadLaunchReadinessValidatorConfigFile(repositoryRoot)
    : null;
  const envConfig: Partial<LaunchReadinessValidatorConfiguration> = {
    enabled: envBool(
      "LAUNCH_READINESS_VALIDATOR_ENABLED",
      DEFAULT_LAUNCH_READINESS_VALIDATOR_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "LAUNCH_READINESS_VALIDATOR_TIMEOUT_MS",
      DEFAULT_LAUNCH_READINESS_VALIDATOR_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "LAUNCH_READINESS_VALIDATOR_MAX_RETRIES",
      DEFAULT_LAUNCH_READINESS_VALIDATOR_CONFIGURATION.maxRetryAttempts,
    ),
    loggingLevel: envString(
      "LAUNCH_READINESS_VALIDATOR_LOG_LEVEL",
      DEFAULT_LAUNCH_READINESS_VALIDATOR_CONFIGURATION.loggingLevel,
    ) as LaunchReadinessValidatorConfiguration["loggingLevel"],
    autoRecover: envBool(
      "LAUNCH_READINESS_VALIDATOR_AUTO_RECOVER",
      DEFAULT_LAUNCH_READINESS_VALIDATOR_CONFIGURATION.autoRecover,
    ),
    launchThreshold: envInt(
      "LAUNCH_READINESS_VALIDATOR_THRESHOLD",
      DEFAULT_LAUNCH_READINESS_VALIDATOR_CONFIGURATION.launchThreshold,
    ),
    maxReadinessRecordsPerCycle: envInt(
      "LAUNCH_READINESS_VALIDATOR_MAX_RECORDS",
      DEFAULT_LAUNCH_READINESS_VALIDATOR_CONFIGURATION.maxReadinessRecordsPerCycle,
    ),
  };

  return {
    ...DEFAULT_LAUNCH_READINESS_VALIDATOR_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    neverExposeCredentials: true,
    neverCertifyWithoutValidation: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
  };
}
