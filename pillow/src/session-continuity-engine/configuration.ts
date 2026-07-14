/** T1-09 — Externalized Session Continuity configuration. */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export type SessionContinuityConfiguration = {
  enabled: boolean;
  continuityUpdateIntervalMs: number;
  maxUpdateRate: number;
  sessionTimeoutMs: number;
  recentHistoryWindow: number;
  stableStateThreshold: number;
  continuityBufferLimit: number;
  persistenceRoot: string;
  persistSessionContext: boolean;
  maskSensitiveValues: boolean;
  sensitiveFieldPatterns: string[];
  maxRetryAttempts: number;
  retryDelayMs: number;
  continuityTimeoutMs: number;
  loggingLevel: "debug" | "info" | "warn" | "error";
  autoRecover: boolean;
  validateContinuity: boolean;
};

export const SENSITIVE_FIELD_PATTERNS = [
  "password",
  "passwd",
  "secret",
  "token",
  "apikey",
  "api_key",
  "auth",
  "credential",
  "payment",
  "card",
  "cvv",
  "ssn",
  "social_security",
];

export const DEFAULT_SESSION_CONTINUITY_CONFIGURATION: SessionContinuityConfiguration = {
  enabled: true,
  continuityUpdateIntervalMs: 1500,
  maxUpdateRate: 4,
  sessionTimeoutMs: 30 * 60 * 1000,
  recentHistoryWindow: 20,
  stableStateThreshold: 3,
  continuityBufferLimit: 30,
  persistenceRoot: ".pillow-session-continuity",
  persistSessionContext: true,
  maskSensitiveValues: true,
  sensitiveFieldPatterns: [...SENSITIVE_FIELD_PATTERNS],
  maxRetryAttempts: 5,
  retryDelayMs: 2000,
  continuityTimeoutMs: 10000,
  loggingLevel: "info",
  autoRecover: true,
  validateContinuity: true,
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

export function loadSessionContinuityConfigFile(
  repositoryRoot: string,
): Partial<SessionContinuityConfiguration> | null {
  const candidates = [
    join(repositoryRoot, "session-continuity.config.json"),
    join(repositoryRoot, "config", "session-continuity.config.json"),
  ];
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return JSON.parse(readFileSync(path, "utf8")) as Partial<SessionContinuityConfiguration>;
    } catch {
      return null;
    }
  }
  return null;
}

export function buildSessionContinuityConfiguration(
  repositoryRoot?: string,
  overrides: Partial<SessionContinuityConfiguration> = {},
): SessionContinuityConfiguration {
  const fileConfig = repositoryRoot ? loadSessionContinuityConfigFile(repositoryRoot) : null;
  const envConfig: Partial<SessionContinuityConfiguration> = {
    enabled: envBool("SESSION_CONTINUITY_ENABLED", DEFAULT_SESSION_CONTINUITY_CONFIGURATION.enabled),
    continuityUpdateIntervalMs: envInt(
      "SESSION_CONTINUITY_INTERVAL_MS",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.continuityUpdateIntervalMs,
    ),
    maxUpdateRate: envInt(
      "SESSION_CONTINUITY_MAX_RATE",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.maxUpdateRate,
    ),
    sessionTimeoutMs: envInt(
      "SESSION_CONTINUITY_TIMEOUT_MS",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.sessionTimeoutMs,
    ),
    recentHistoryWindow: envInt(
      "SESSION_CONTINUITY_HISTORY_WINDOW",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.recentHistoryWindow,
    ),
    persistSessionContext: envBool(
      "SESSION_CONTINUITY_PERSIST",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.persistSessionContext,
    ),
    maskSensitiveValues: envBool(
      "SESSION_CONTINUITY_MASK_SENSITIVE",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.maskSensitiveValues,
    ),
    maxRetryAttempts: envInt(
      "SESSION_CONTINUITY_MAX_RETRIES",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.maxRetryAttempts,
    ),
    retryDelayMs: envInt(
      "SESSION_CONTINUITY_RETRY_DELAY_MS",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.retryDelayMs,
    ),
    continuityTimeoutMs: envInt(
      "SESSION_CONTINUITY_OPERATION_TIMEOUT_MS",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.continuityTimeoutMs,
    ),
    loggingLevel: envString(
      "SESSION_CONTINUITY_LOG_LEVEL",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.loggingLevel,
    ) as SessionContinuityConfiguration["loggingLevel"],
    autoRecover: envBool(
      "SESSION_CONTINUITY_AUTO_RECOVER",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.autoRecover,
    ),
    validateContinuity: envBool(
      "SESSION_CONTINUITY_VALIDATE",
      DEFAULT_SESSION_CONTINUITY_CONFIGURATION.validateContinuity,
    ),
  };

  return {
    ...DEFAULT_SESSION_CONTINUITY_CONFIGURATION,
    ...fileConfig,
    ...envConfig,
    ...overrides,
  };
}

export function effectiveContinuityUpdateIntervalMs(
  config: SessionContinuityConfiguration,
): number {
  const minInterval = Math.ceil(1000 / Math.max(1, config.maxUpdateRate));
  return Math.max(minInterval, config.continuityUpdateIntervalMs);
}
