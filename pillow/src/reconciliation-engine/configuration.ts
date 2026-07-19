/** R3-08 — Externalized Reconciliation Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type ReconciliationEngineConfiguration = {
  enabled: boolean;
  matchingRulesEnabled: boolean;
  amountTolerance: number;
  differenceThreshold: number;
  validationRulesEnabled: boolean;
  duplicateDetectionEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultCurrency: string;
  maskSensitiveValues: true;
};

export const DEFAULT_RECONCILIATION_ENGINE_CONFIGURATION: ReconciliationEngineConfiguration = {
  enabled: true,
  matchingRulesEnabled: true,
  amountTolerance: 0.01,
  differenceThreshold: 1.0,
  validationRulesEnabled: true,
  duplicateDetectionEnabled: true,
  connectionTimeoutMs: 30000,
  maxRetryAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  loggingLevel: "info",
  autoRecover: true,
  defaultCurrency: "USD",
  maskSensitiveValues: true,
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

export function loadReconciliationEngineConfigFile(
  repositoryRoot: string,
): Partial<ReconciliationEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "reconciliation-engine.config.json"),
    join(repositoryRoot, "config", "reconciliation-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<ReconciliationEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildReconciliationEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ReconciliationEngineConfiguration> = {},
): ReconciliationEngineConfiguration {
  const fileConfig = repositoryRoot ? loadReconciliationEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<ReconciliationEngineConfiguration> = {
    enabled: envBool(
      "RECONCILIATION_ENGINE_ENABLED",
      DEFAULT_RECONCILIATION_ENGINE_CONFIGURATION.enabled,
    ),
    connectionTimeoutMs: envInt(
      "RECONCILIATION_ENGINE_TIMEOUT_MS",
      DEFAULT_RECONCILIATION_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "RECONCILIATION_ENGINE_MAX_RETRIES",
      DEFAULT_RECONCILIATION_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    differenceThreshold: envFloat(
      "RECONCILIATION_ENGINE_DIFFERENCE_THRESHOLD",
      DEFAULT_RECONCILIATION_ENGINE_CONFIGURATION.differenceThreshold,
    ),
    loggingLevel: envString(
      "RECONCILIATION_ENGINE_LOG_LEVEL",
      DEFAULT_RECONCILIATION_ENGINE_CONFIGURATION.loggingLevel,
    ) as ReconciliationEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "RECONCILIATION_ENGINE_AUTO_RECOVER",
      DEFAULT_RECONCILIATION_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_RECONCILIATION_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
