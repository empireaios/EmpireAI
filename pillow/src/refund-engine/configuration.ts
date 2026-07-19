/** R3-10 — Externalized Refund Engine configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type RefundEngineConfiguration = {
  enabled: boolean;
  eligibilityRulesEnabled: boolean;
  partialRefundRulesEnabled: boolean;
  maxPartialRefundRatio: number;
  validationRulesEnabled: boolean;
  anomalyDetectionEnabled: boolean;
  connectionTimeoutMs: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
  retryBackoffMultiplier: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  defaultCurrency: string;
  maskSensitiveValues: true;
};

export const DEFAULT_REFUND_ENGINE_CONFIGURATION: RefundEngineConfiguration = {
  enabled: true,
  eligibilityRulesEnabled: true,
  partialRefundRulesEnabled: true,
  maxPartialRefundRatio: 1,
  validationRulesEnabled: true,
  anomalyDetectionEnabled: true,
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

export function loadRefundEngineConfigFile(
  repositoryRoot: string,
): Partial<RefundEngineConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "refund-engine.config.json"),
    join(repositoryRoot, "config", "refund-engine.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<RefundEngineConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildRefundEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<RefundEngineConfiguration> = {},
): RefundEngineConfiguration {
  const fileConfig = repositoryRoot ? loadRefundEngineConfigFile(repositoryRoot) : null;
  const envConfig: Partial<RefundEngineConfiguration> = {
    enabled: envBool("REFUND_ENGINE_ENABLED", DEFAULT_REFUND_ENGINE_CONFIGURATION.enabled),
    connectionTimeoutMs: envInt(
      "REFUND_ENGINE_TIMEOUT_MS",
      DEFAULT_REFUND_ENGINE_CONFIGURATION.connectionTimeoutMs,
    ),
    maxRetryAttempts: envInt(
      "REFUND_ENGINE_MAX_RETRIES",
      DEFAULT_REFUND_ENGINE_CONFIGURATION.maxRetryAttempts,
    ),
    maxPartialRefundRatio: envFloat(
      "REFUND_ENGINE_MAX_PARTIAL_RATIO",
      DEFAULT_REFUND_ENGINE_CONFIGURATION.maxPartialRefundRatio,
    ),
    loggingLevel: envString(
      "REFUND_ENGINE_LOG_LEVEL",
      DEFAULT_REFUND_ENGINE_CONFIGURATION.loggingLevel,
    ) as RefundEngineConfiguration["loggingLevel"],
    autoRecover: envBool(
      "REFUND_ENGINE_AUTO_RECOVER",
      DEFAULT_REFUND_ENGINE_CONFIGURATION.autoRecover,
    ),
  };

  return {
    ...DEFAULT_REFUND_ENGINE_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
    maskSensitiveValues: true,
  };
}
